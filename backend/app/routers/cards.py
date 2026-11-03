import secrets
import base64
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import cast, String
from cryptography.fernet import Fernet

from app.config import get_settings
from app.database import get_db
from app.models.user import User, Account
from app.models.card import VirtualCard, CardStatus
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.schemas.card import CardResponse, CardRequestPayload
from app.middleware.auth import get_current_user
from app.services.card_email_service import send_card_approval_email
from app.services.notification_service import notification_service

settings = get_settings()
_secret_bytes = settings.BETTER_AUTH_SECRET.encode("utf-8")
_secret_bytes = (_secret_bytes.ljust(32, b"0") if len(_secret_bytes) < 32 else _secret_bytes)[:32]
fernet = Fernet(base64.urlsafe_b64encode(_secret_bytes))

def encrypt_val(val: str) -> str:
    return fernet.encrypt(val.encode("utf-8")).decode("utf-8") if val else ""

def decrypt_val(val: str) -> str:
    if not val:
        return ""
    try:
        return fernet.decrypt(val.encode("utf-8")).decode("utf-8")
    except Exception:
        return val

router = APIRouter(prefix="/cards", tags=["Virtual Cards"])

@router.get("", response_model=List[CardResponse])
async def get_user_cards(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = await db.execute(select(VirtualCard).filter(VirtualCard.user_id == current_user.id))
    cards = query.scalars().all()
    now = datetime.datetime.utcnow()
    updated_any = False
    response = []

    for c in cards:
        remaining_min = 0
        if c.status == CardStatus.PROCESSING and c.approved_at:
            activation_time = c.approved_at + datetime.timedelta(hours=c.activation_delay_hours)
            if now >= activation_time:
                c.status = CardStatus.COMPLETED
                updated_any = True
                raw_num = decrypt_val(c.card_number_encrypted) or "4000000000000000"
                symbol = "£" if current_user.account and current_user.account.currency.value == "GBP" else "$"
                background_tasks.add_task(
                    send_card_approval_email,
                    email=current_user.email,
                    full_name=current_user.full_name,
                    last4=raw_num[-4:],
                    balance=float(c.balance),
                    symbol=symbol
                )
                background_tasks.add_task(
                    notification_service.create_notification,
                    db=db,
                    user_id=current_user.id,
                    type="card",
                    title="Virtual Card Activated",
                    message=f"Your card ending in {raw_num[-4:]} is active and ready for purchases."
                )
            else:
                remaining_sec = (activation_time - now).total_seconds()
                remaining_min = max(1, int(remaining_sec // 60))

        raw_number = decrypt_val(c.card_number_encrypted) or "4000000000000000"
        cvv = decrypt_val(c.cvv_encrypted) or "123"
        response.append(
            CardResponse(
                id=c.id,
                card_number=raw_number,
                last4=raw_number[-4:],
                expiry=c.expiry or "12/30",
                cvv=cvv,
                status=str(c.status.value if hasattr(c.status, "value") else c.status).lower(),
                is_frozen=c.is_frozen,
                cardholder_name=current_user.full_name,
                balance=float(c.balance),
                funding_amount=float(c.funding_amount),
                source_account=c.source_account,
                approved_at=c.approved_at,
                activation_delay_hours=c.activation_delay_hours,
                activation_remaining_minutes=remaining_min
            )
        )

    if updated_any:
        await db.commit()

    return response

@router.post("", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
async def request_virtual_card(
    data: CardRequestPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    acc_query = await db.execute(select(Account).filter(Account.user_id == current_user.id))
    user_account = acc_query.scalars().first()
    if not user_account:
        raise HTTPException(status_code=404, detail="Account profile not found")

    if user_account.is_frozen:
        reason = getattr(user_account, "freeze_reason", None) or "Your account has a temporary security hold. Card requests and outgoing activity are paused."
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"FROZEN:{reason}"
        )

    from decimal import Decimal
    amount_dec = Decimal(str(data.amount))
    source = (data.source_account or "checking").lower()
    avail_balance = float(user_account.checking_balance) if source == "checking" else float(user_account.savings_balance)
    if data.amount > avail_balance:
        raise HTTPException(status_code=400, detail=f"Insufficient balance in selected {source} account.")

    existing_query = await db.execute(
        select(VirtualCard).filter(
            VirtualCard.user_id == current_user.id,
            cast(VirtualCard.status, String).in_([
                CardStatus.COMPLETED.value, CardStatus.PENDING.value, CardStatus.PROCESSING.value,
                "completed", "pending", "processing"
            ])
        )
    )
    if len(existing_query.scalars().all()) >= 3:
        raise HTTPException(status_code=400, detail="Maximum limit of 3 active/pending virtual cards reached.")

    # Deduct initial funding amount from chosen account immediately
    if source == "checking":
        user_account.checking_balance -= amount_dec
    else:
        user_account.savings_balance -= amount_dec
    user_account.balance = user_account.checking_balance + user_account.savings_balance + user_account.credit_balance

    card_digits = "".join(secrets.choice("0123456789") for _ in range(12))
    card_number = f"4111{card_digits}"
    cvv = "".join(secrets.choice("0123456789") for _ in range(3))
    today = datetime.date.today()
    expiry_date = f"{today.month:02d}/{(today.year + 4) % 100}"

    new_card = VirtualCard(
        user_id=current_user.id,
        card_number_encrypted=encrypt_val(card_number),
        expiry=expiry_date,
        cvv_encrypted=encrypt_val(cvv),
        status=CardStatus.PENDING,
        is_frozen=False,
        funding_amount=data.amount,
        balance=data.amount,
        source_account=source,
        activation_delay_hours=1
    )
    db.add(new_card)

    tx = Transaction(
        from_account_id=user_account.id,
        type=TransactionType.P2P,
        amount=amount_dec,
        currency=user_account.currency,
        status=TransactionStatus.COMPLETED,
        memo=f"Virtual Card Request Funding from {source.capitalize()}"
    )
    db.add(tx)
    await db.commit()
    await db.refresh(new_card)

    return CardResponse(
        id=new_card.id,
        card_number=card_number,
        last4=card_number[-4:],
        expiry=expiry_date,
        cvv=cvv,
        status=new_card.status,
        is_frozen=False,
        cardholder_name=current_user.full_name,
        balance=float(new_card.balance),
        funding_amount=float(new_card.funding_amount),
        source_account=source,
        approved_at=None,
        activation_delay_hours=1,
        activation_remaining_minutes=0
    )

@router.patch("/{card_id}/toggle", response_model=CardResponse)
async def toggle_card_status(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    import uuid
    try:
        c_id = uuid.UUID(card_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid card ID")

    query = await db.execute(select(VirtualCard).filter(VirtualCard.id == c_id, VirtualCard.user_id == current_user.id))
    card = query.scalars().first()
    if not card:
        raise HTTPException(status_code=404, detail="Virtual card not found")

    card.is_frozen = not card.is_frozen
    await db.commit()
    await db.refresh(card)

    raw_number = decrypt_val(card.card_number_encrypted) or "4000000000000000"
    cvv = decrypt_val(card.cvv_encrypted) or "123"

    return CardResponse(
        id=card.id,
        card_number=raw_number,
        last4=raw_number[-4:],
        expiry=card.expiry or "12/30",
        cvv=cvv,
        status=card.status,
        is_frozen=card.is_frozen,
        cardholder_name=current_user.full_name,
        balance=float(card.balance),
        funding_amount=float(card.funding_amount),
        source_account=card.source_account,
        approved_at=card.approved_at,
        activation_delay_hours=card.activation_delay_hours,
        activation_remaining_minutes=0
    )
