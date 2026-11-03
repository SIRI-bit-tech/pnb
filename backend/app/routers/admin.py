from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc, or_, cast, String
from sqlalchemy.orm import selectinload
import uuid
import datetime
import random
from datetime import datetime as dt, timezone
from decimal import Decimal
from typing import List, Optional

from app.database import get_db
from app.models.user import User, Account, UserRole, CurrencyType
from app.models.deposit import Deposit, DepositType, DepositStatus
from app.models.transaction import Transaction, TransactionStatus, TransactionType
from app.models.card import VirtualCard, CardStatus
from app.models.admin_config import AdminConfig
from app.schemas.deposit import DepositResponse, AdminDepositReviewRequest, DepositListResponse
from app.schemas.admin import (
    AdminConfigResponse, AdminConfigUpdate, AnalyticsResponse, UserBanRequest,
    AccountBalanceUpdate, AccountFreezeRequest, SupportTicketResponse, SupportTicketReply,
    GenerateTransactionsRequest, AdminUserUpdateRequest, AirlineBookingTransactionRequest
)
from app.schemas.user import UserResponse, AccountResponse, ProfileUpdateRequest
import logging
from app.services.deposit_service import DepositService, upload_image_to_uploadthing
from app.services.transfer_service import send_transfer_completed_email
from app.services.auth_service import AuthService
from app.middleware.auth import require_admin
from app.routers.cards import decrypt_val

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin Portal"], dependencies=[Depends(require_admin)])

@router.get("/deposits", response_model=DepositListResponse)
async def list_deposits(
    status_filter: Optional[DepositStatus] = None,
    type_filter: Optional[DepositType] = None,
    page: int = 1,
    page_size: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """
    Lists deposit requests with status/type filtering and pagination.
    """
    offset = (page - 1) * page_size
    query = select(Deposit)
    
    if status_filter:
        query = query.filter(Deposit.status == status_filter)
    if type_filter:
        query = query.filter(Deposit.type == type_filter)
        
    # Count total
    count_query = select(func.count(Deposit.id))
    if status_filter:
        count_query = count_query.filter(Deposit.status == status_filter)
    if type_filter:
        count_query = count_query.filter(Deposit.type == type_filter)
        
    total_result = await db.execute(count_query)
    total_count = total_result.scalar() or 0

    # Paginate
    query = query.order_by(desc(Deposit.created_at)).offset(offset).limit(page_size)
    result = await db.execute(query)
    deposits = result.scalars().all()
    
    return DepositListResponse(
        deposits=deposits,
        total_count=total_count
    )

@router.patch("/deposits/{id}", response_model=DepositResponse)
async def review_deposit_endpoint(
    id: uuid.UUID,
    review_data: AdminDepositReviewRequest,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Confirms or rejects a user deposit and updates their account balance.
    """
    try:
        deposit = await DepositService.review_deposit(
            db=db,
            deposit_id=id,
            status=review_data.status,
            admin_notes=review_data.admin_notes,
            reviewer=current_admin
        )
        return deposit
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to review deposit: {str(e)}"
        )

@router.get("/config", response_model=List[AdminConfigResponse])
async def list_configs(db: AsyncSession = Depends(get_db)):
    """
    Lists all admin key-value configs (CashApp and PayPal details).
    """
    result = await db.execute(select(AdminConfig))
    return result.scalars().all()

@router.put("/config/{key}", response_model=AdminConfigResponse)
async def update_config_value(
    key: str,
    data: AdminConfigUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Sets a text config value (e.g. CashApp tag or PayPal email/details).
    """
    result = await db.execute(select(AdminConfig).filter(AdminConfig.key == key))
    config = result.scalars().first()
    
    if not config:
        config = AdminConfig(key=key, value=data.value)
        db.add(config)
    else:
        config.value = data.value
        
    await db.commit()
    await db.refresh(config)
    return config

@router.post("/config/upload-qr")
async def upload_config_qr_image(
    key: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Uploads a QR code image to UploadThing and saves its URL in the config.
    Allowed keys: cashapp_qr_url, paypal_qr_url
    """
    if key not in ["cashapp_qr_url", "paypal_qr_url"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid QR code configuration key"
        )
        
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QR code must be a JPG, JPEG or PNG image"
        )

    try:
        file_bytes = await file.read()
        qr_url = await upload_image_to_uploadthing(file_bytes)
        
        if not qr_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="QR code upload to UploadThing failed"
            )

        result = await db.execute(select(AdminConfig).filter(AdminConfig.key == key))
        config = result.scalars().first()
        
        if not config:
            config = AdminConfig(key=key, value=qr_url)
            db.add(config)
        else:
            config.value = qr_url
            
        await db.commit()
        return {"key": key, "qr_code_url": qr_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/analytics", response_model=AnalyticsResponse)
async def get_dashboard_analytics(db: AsyncSession = Depends(get_db)):
    """
    Calculates operational KPIs for the admin dashboard.
    """
    # 1. Total users
    users_count = await db.execute(select(func.count(User.id)))
    total_users = users_count.scalar() or 0

    # 2. Total deposits confirmed
    dep_sum = await db.execute(
        select(func.sum(Deposit.amount)).filter(Deposit.status == DepositStatus.CONFIRMED)
    )
    total_dep = dep_sum.scalar() or Decimal("0.00")

    # 3. Pending deposits count
    pending_count = await db.execute(
        select(func.count(Deposit.id)).filter(Deposit.status == DepositStatus.PENDING)
    )
    total_pending = pending_count.scalar() or 0

    # 4. Total transactions count
    tx_count = await db.execute(select(func.count(Transaction.id)))
    total_tx = tx_count.scalar() or 0

    # 5. Total active cards
    cards_count = await db.execute(
        select(func.count(VirtualCard.id)).filter(
            cast(VirtualCard.status, String).in_([CardStatus.COMPLETED.value, "completed"])
        )
    )
    active_cards = cards_count.scalar() or 0

    # 6. Average deposit processing time (in seconds)
    avg_time_query = await db.execute(
        select(
            func.avg(
                func.extract('epoch', Deposit.reviewed_at - Deposit.created_at)
            )
        ).filter(Deposit.reviewed_at.is_not(None))
    )
    avg_processing = avg_time_query.scalar() or 0.0

    # 7. Transactions today
    from datetime import datetime, time, timezone
    today_start = datetime.combine(datetime.now(timezone.utc).date(), time.min).replace(tzinfo=timezone.utc)
    tx_today = await db.execute(select(func.count(Transaction.id)).filter(Transaction.created_at >= today_start))
    transactions_today_count = tx_today.scalar() or 0
    
    # 8. Open support tickets
    from app.models.support import SupportTicket, TicketStatus
    tickets_open = await db.execute(select(func.count(SupportTicket.id)).filter(SupportTicket.status == TicketStatus.OPEN))
    open_support_tickets_count = tickets_open.scalar() or 0

    # 9. Daily trends for the last 7 days
    from datetime import timedelta
    daily_trends = []
    now_utc = datetime.now(timezone.utc)
    for i in range(6, -1, -1):
        day_date = (now_utc - timedelta(days=i)).date()
        day_start = datetime.combine(day_date, time.min).replace(tzinfo=timezone.utc)
        day_end = datetime.combine(day_date, time.max).replace(tzinfo=timezone.utc)
        
        # Confirmed deposits sum for this day
        dep_day_query = await db.execute(
            select(func.sum(Deposit.amount))
            .filter(Deposit.status == DepositStatus.CONFIRMED, Deposit.created_at >= day_start, Deposit.created_at <= day_end)
        )
        dep_day_sum = dep_day_query.scalar() or Decimal("0.00")
        
        # Completed transactions sum for this day
        tx_day_query = await db.execute(
            select(func.sum(Transaction.amount))
            .filter(Transaction.status == TransactionStatus.COMPLETED, Transaction.created_at >= day_start, Transaction.created_at <= day_end)
        )
        tx_day_sum = tx_day_query.scalar() or Decimal("0.00")
        
        day_name = day_date.strftime("%a")
        daily_trends.append({
            "name": day_name,
            "deposits": float(dep_day_sum),
            "transfers": float(tx_day_sum)
        })

    return AnalyticsResponse(
        total_users=total_users,
        total_deposits_amount=total_dep,
        pending_deposits_count=total_pending,
        avg_deposit_processing_time_seconds=float(avg_processing),
        total_transactions_count=total_tx,
        total_active_cards=active_cards,
        transactions_today_count=transactions_today_count,
        open_support_tickets_count=open_support_tickets_count,
        daily_trends=daily_trends
    )

@router.get("/users", response_model=List[UserResponse])
async def list_all_registered_users(
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """
    Lists all registered users in the banking database, eager loading their accounts.
    """
    offset = (page - 1) * page_size
    query = (
        select(User)
        .options(selectinload(User.account))
        .order_by(desc(User.created_at))
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/transfers/{id}/confirm")
async def manual_confirm_transfer(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Manually forces completion of a pending or processing external transfer.
    """
    query = (
        select(Transaction)
        .filter(Transaction.id == id)
        .options(selectinload(Transaction.from_account).selectinload(Account.user))
    )
    result = await db.execute(query)
    tx = result.scalars().first()
    
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
        
    if tx.type not in [TransactionType.ACH, TransactionType.WIRE]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only ACH and Wire transfers can be manually confirmed"
        )
        
    if tx.status == TransactionStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction is already completed"
        )
        
    tx.status = TransactionStatus.COMPLETED
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    
    user = tx.from_account.user if (tx.from_account and tx.from_account.user) else None
    if user:
        try:
            from app.models.notification import NotificationType
            from app.services.notification_service import notification_service
            title = "Transfer Completed"
            msg = f"Your {tx.type.value.upper()} transfer of {tx.currency.value} {tx.amount:.2f} to {tx.external_bank_name} was manually confirmed by administrator."
            await notification_service.create_notification(
                db,
                user_id=user.id,
                type=NotificationType.TRANSFER,
                title=title,
                message=msg
            )
        except Exception as e:
            logger.error(f"Failed to create manual confirmation notification: {e}")
            
        try:
            await send_transfer_completed_email(
                email=user.email,
                full_name=user.full_name,
                tx_type=tx.type.value,
                amount=tx.amount,
                currency=tx.currency.value,
                bank_name=tx.external_bank_name,
                fee=tx.fee
            )
        except Exception as e:
            logger.error(f"Failed to send manual confirmation email: {e}")
            
    return {"message": "Transaction manually confirmed and completed successfully", "transaction_id": str(tx.id)}

@router.put("/users/{user_id}", response_model=UserResponse)
async def admin_edit_user(
    user_id: uuid.UUID,
    update_data: AdminUserUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to edit a user's details including address, DOB, gender, and date joined."""
    query = select(User).filter(User.id == user_id).options(selectinload(User.account))
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    for key, value in update_data.model_dump(exclude_unset=True).items():
        if key == "country" and value and value != user.country:
            user.country = value
            from app.utils.validators import get_currency_for_country
            new_curr = get_currency_for_country(value)
            user.currency = new_curr
            if user.account:
                user.account.currency = new_curr
        else:
            setattr(user, key, value)
        
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def admin_delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to completely delete a user and all their data."""
    query = select(User).filter(User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted successfully"}

@router.post("/users/{user_id}/ban", response_model=UserResponse)
async def admin_ban_user(
    user_id: uuid.UUID,
    ban_data: UserBanRequest,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to ban or unban a user."""
    query = select(User).filter(User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = ban_data.is_active
    user.ban_reason = ban_data.ban_reason
    
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/users/{user_id}/approve", response_model=UserResponse)
async def admin_approve_user(
    user_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to officially approve a user's account and dispatch confirmation email."""
    query = select(User).filter(User.id == user_id).options(selectinload(User.account))
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_approved = True
    user.is_active = True
    await db.commit()
    await db.refresh(user)

    # Dispatch official bank approval email via Resend
    checking_acc = user.account.checking_account_number if user.account else None
    background_tasks.add_task(
        AuthService.send_account_approved_email,
        user.email,
        user.full_name,
        checking_acc
    )

    # In-app notification
    try:
        from app.models.notification import NotificationType
        from app.services.notification_service import notification_service
        await notification_service.create_notification(
            db,
            user_id=user.id,
            type=NotificationType.SECURITY,
            title="Account Approved",
            message="Your Prescott National Bank account application has been verified and officially approved. Welcome to Prescott National Bank!"
        )
    except Exception as e:
        logger.error(f"Failed to create approval notification: {e}")

    return user

@router.get("/accounts", response_model=List[AccountResponse])
async def list_all_accounts(
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Lists all accounts."""
    offset = (page - 1) * page_size
    query = select(Account).order_by(desc(Account.created_at)).offset(offset).limit(page_size)
    result = await db.execute(query)
    return result.scalars().all()

@router.put("/accounts/{user_id}/balance", response_model=AccountResponse)
async def admin_update_account_balance(
    user_id: uuid.UUID,
    update_data: AccountBalanceUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to manually top up or deduct from checking/savings."""
    query = select(Account).filter(Account.user_id == user_id)
    result = await db.execute(query)
    account = result.scalars().first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    if update_data.checking_amount is not None:
        account.checking_balance = Decimal(str(update_data.checking_amount))
    if update_data.savings_amount is not None:
        account.savings_balance = Decimal(str(update_data.savings_amount))
    if update_data.credit_amount is not None:
        account.credit_balance = Decimal(str(update_data.credit_amount))
        
    account.balance = account.checking_balance + account.savings_balance
    
    await db.commit()
    await db.refresh(account)
    return account

@router.post("/accounts/{user_id}/freeze", response_model=AccountResponse)
async def admin_freeze_account(
    user_id: uuid.UUID,
    freeze_data: AccountFreezeRequest,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to freeze (Post-No-Debit) or unfreeze a user's account."""
    query = select(Account).filter(Account.user_id == user_id)
    result = await db.execute(query)
    account = result.scalars().first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    account.is_frozen = freeze_data.is_frozen
    if freeze_data.is_frozen:
        account.freeze_reason = freeze_data.freeze_reason or "We detected an unrecognized sign-in attempt from an unknown device and unfamiliar location. A temporary security hold has been placed to protect your account from unauthorized activity."
    else:
        account.freeze_reason = None
    
    await db.commit()
    await db.refresh(account)

    try:
        from app.models.notification import NotificationType
        from app.services.notification_service import notification_service
        if account.is_frozen:
            await notification_service.create_notification(
                db,
                user_id=user_id,
                type=NotificationType.SECURITY,
                title="Security Notice: Temporary Account Hold",
                message=f"{account.freeze_reason} Outgoing transfers and withdrawals are paused until your identity is verified in-person at a branch location."
            )
        else:
            await notification_service.create_notification(
                db,
                user_id=user_id,
                type=NotificationType.SECURITY,
                title="Account Hold Removed",
                message="The hold on your account has been removed. Outgoing transfers and debit transactions are now available."
            )
    except Exception as e:
        logger.warning(f"Failed to create freeze notification: {e}")
        await db.rollback()
        query = select(Account).filter(Account.user_id == user_id)
        result = await db.execute(query)
        account = result.scalars().first()

    return account

@router.post("/accounts/generate-transactions")
async def admin_generate_transactions(
    request_data: GenerateTransactionsRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Admin endpoint to generate realistic electrical engineering, grid, transformer, and AT&T
    transactions for a user spanning historical days, and top up the closing balance split 50/50 into checking & savings.
    """
    from app.services.transaction_generator import TransactionGeneratorService
    
    user_query = await db.execute(select(User).filter(User.id == request_data.user_id))
    user = user_query.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    try:
        result = await TransactionGeneratorService.generate_history_for_user(
            db=db,
            user=user,
            starting_balance=request_data.starting_balance,
            closing_balance=request_data.closing_balance,
            days=request_data.days or 60,
            start_date=request_data.start_date,
            end_date=request_data.end_date,
            split_ratio=request_data.split_ratio,
            transaction_count=request_data.transaction_count
        )
        return result
    except Exception as e:
        logger.error(f"Error generating transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transactions/airline-booking")
async def admin_create_airline_booking(
    request_data: AirlineBookingTransactionRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Admin endpoint to generate an airline flight booking transaction for a user.
    Appears on the user's ledger, history, and receipts without debiting or altering account balance.
    """
    user_query = await db.execute(
        select(User).options(selectinload(User.account)).filter(User.id == request_data.user_id)
    )
    user = user_query.scalars().first()
    if not user or not user.account:
        raise HTTPException(status_code=404, detail="User or user account not found")
        
    account = user.account

    # Parse custom date or default to now
    tx_time = dt.now(timezone.utc)
    if request_data.date:
        try:
            date_clean = request_data.date.strip().replace("Z", "+00:00")
            if "T" in date_clean or "+" in date_clean:
                parsed = dt.fromisoformat(date_clean)
            elif len(date_clean) == 10:
                parsed = dt.strptime(date_clean, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            else:
                parsed = dt.strptime(date_clean, "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            tx_time = parsed
        except Exception as e:
            logger.warning(f"Could not parse custom date '{request_data.date}', defaulting to now: {e}")

    # Build booking reference and memo
    booking_ref = request_data.booking_reference or f"TKT-{random.randint(100000, 999999)}"
    route_str = f" {request_data.flight_route}" if request_data.flight_route else ""
    cabin_str = f" ({request_data.cabin_class})" if request_data.cabin_class else ""
    
    if request_data.memo:
        memo = request_data.memo
    else:
        memo = f"{request_data.airline_name}: Flight{route_str}{cabin_str} | PNR: {booking_ref}"

    bank_name = request_data.bank_or_processor or f"{request_data.airline_name} Merchant Processing / Amex Global Flight Settlement"

    # Status mapping
    status_val = TransactionStatus.COMPLETED
    if request_data.status:
        st_clean = request_data.status.lower()
        if st_clean == "pending":
            status_val = TransactionStatus.PENDING
        elif st_clean == "processing":
            status_val = TransactionStatus.PROCESSING
        elif st_clean == "failed":
            status_val = TransactionStatus.FAILED

    curr = account.currency
    if request_data.currency:
        try:
            curr = CurrencyType(request_data.currency.upper())
        except Exception:
            curr = account.currency

    # Create transaction with NO balance modification
    tx = Transaction(
        from_account_id=account.id,
        to_account_id=None,
        type=TransactionType.ACH,
        amount=request_data.amount,
        currency=curr,
        status=status_val,
        external_bank_name=bank_name,
        external_account_name=request_data.airline_name,
        external_account_number=booking_ref,
        fee=Decimal("0.0000"),
        memo=memo[:255]
    )
    tx.created_at = tx_time
    tx.updated_at = tx_time

    db.add(tx)
    await db.commit()
    await db.refresh(tx)

    # Note: We deliberately DO NOT modify account.balance, account.checking_balance, or account.savings_balance.
    return {
        "status": "success",
        "message": f"Airline booking transaction created for {request_data.airline_name}",
        "transaction_id": str(tx.id),
        "created_at": tx.created_at.isoformat(),
        "amount": str(tx.amount),
        "airline": request_data.airline_name,
        "booking_reference": booking_ref
    }

@router.get("/transactions", response_model=List[dict])
async def list_transactions(
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to list all transactions."""
    offset = (page - 1) * page_size
    query = select(Transaction).order_by(desc(Transaction.created_at)).offset(offset).limit(page_size)
    result = await db.execute(query)
    
    txs = result.scalars().all()
    # Pydantic dict representation
    return [{"id": str(t.id), "type": t.type.value, "amount": str(t.amount), "status": t.status.value, "created_at": t.created_at.isoformat()} for t in txs]

@router.post("/transfers/{id}/reject")
async def manual_reject_transfer(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to reject a transfer and refund the user."""
    # 1. Fetch transaction
    query = select(Transaction).filter(Transaction.id == id)
    result = await db.execute(query)
    tx = result.scalars().first()
    
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    if tx.status in [TransactionStatus.FAILED, TransactionStatus.COMPLETED]:
        raise HTTPException(status_code=400, detail="Transaction has already been finalized")
        
    # 2. Refund user's account if it was an outgoing transfer (ACH/WIRE) that was debited
    if tx.type in [TransactionType.ACH, TransactionType.WIRE] and tx.from_account_id:
        acc_query = await db.execute(
            select(Account).filter(Account.id == tx.from_account_id).with_for_update()
        )
        account = acc_query.scalars().first()
        if account:
            refund_amount = tx.amount + (tx.fee or Decimal("0.0000"))
            account.checking_balance += refund_amount
            account.balance = account.checking_balance + account.savings_balance + account.credit_balance
            db.add(account)
            
            # Create a notification and publish Ably balance update
            try:
                from app.services.ably_service import ably_service
                from app.services.notification_service import notification_service
                from app.models.notification import NotificationType
                
                await ably_service.publish_balance_update(
                    user_id=str(account.user_id),
                    balance=float(account.balance),
                    currency=account.currency.value
                )
                
                title = f"{tx.type.value.upper()} Transfer Rejected"
                msg = f"Your {tx.type.value.upper()} transfer of {tx.currency.value} {tx.amount:.2f} to {tx.external_bank_name} was rejected. A refund of {tx.currency.value} {refund_amount:.2f} has been credited back to your checking account."
                await notification_service.create_notification(
                    db,
                    user_id=account.user_id,
                    type=NotificationType.TRANSFER,
                    title=title,
                    message=msg
                )
            except Exception as e:
                # Log and continue so the transaction status still updates even if notifications fail
                pass
                
    tx.status = TransactionStatus.FAILED
    await db.commit()
    return {"message": "Transaction rejected and refunded successfully"}

@router.get("/tickets", response_model=List[SupportTicketResponse])
async def list_support_tickets(
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to list support tickets."""
    from app.models.support import SupportTicket
    offset = (page - 1) * page_size
    query = select(SupportTicket).order_by(desc(SupportTicket.created_at)).offset(offset).limit(page_size)
    result = await db.execute(query)
    return result.scalars().all()

# ── Support Agent Names (American / UK) ──
SUPPORT_AGENTS = [
    "James Mitchell",
    "Sarah Thompson",
    "Robert Caldwell",
    "Emily Harrison",
    "William Parker",
    "Charlotte Bennett",
    "Daniel Lawson",
    "Rebecca Stewart",
    "Thomas Crawford",
    "Laura Whitfield",
]

@router.get("/support-agents")
async def list_support_agents():
    """Return the list of available support agents for assignment."""
    return {"agents": SUPPORT_AGENTS}

@router.post("/tickets/{id}/assign")
async def assign_ticket_agent(
    id: uuid.UUID,
    body: dict,
    db: AsyncSession = Depends(get_db)
):
    """Assign a support agent to a ticket."""
    from app.models.support import SupportTicket, SupportMessage, TicketStatus
    from app.services.ably_service import ably_service
    from datetime import datetime, timezone

    agent_name = body.get("agent_name", "").strip()
    if not agent_name:
        raise HTTPException(status_code=400, detail="agent_name is required")

    query = select(SupportTicket).filter(SupportTicket.id == id)
    result = await db.execute(query)
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.assigned_agent = agent_name
    if str(ticket.status).lower().replace("ticketstatus.", "") == "open":
        ticket.status = TicketStatus.IN_PROGRESS
    ticket.updated_at = datetime.now(timezone.utc)

    # System message notifying the user that an agent has been assigned
    sys_msg = SupportMessage(
        ticket_id=ticket.id,
        sender_type="system",
        sender_name="Prescott National Bank Support",
        content=f"You've been connected with {agent_name} from our support team. They'll be assisting you with your inquiry.",
        is_read=False
    )
    db.add(sys_msg)
    await db.commit()
    await db.refresh(sys_msg)

    # Broadcast assignment via Ably
    try:
        msg_payload = {
            "id": str(sys_msg.id),
            "ticket_id": str(ticket.id),
            "sender_type": "system",
            "sender_name": sys_msg.sender_name,
            "content": sys_msg.content,
            "created_at": sys_msg.created_at.isoformat() if sys_msg.created_at else datetime.now(timezone.utc).isoformat(),
        }
        await ably_service.publish_support_message(
            ticket_id=str(ticket.id),
            message_data=msg_payload,
            user_id=str(ticket.user_id)
        )
    except Exception as e:
        logger.warning(f"Failed to publish agent assignment to Ably: {e}")

    return {"message": f"Agent '{agent_name}' assigned to ticket", "assigned_agent": agent_name}

@router.post("/tickets/{id}/status")
async def update_ticket_status(
    id: uuid.UUID,
    body: dict,
    db: AsyncSession = Depends(get_db)
):
    """Update ticket status to resolved or closed without sending a reply message."""
    from app.models.support import SupportTicket, SupportMessage, TicketStatus
    from app.services.ably_service import ably_service
    from datetime import datetime, timezone

    new_status = body.get("status", "").strip().lower()
    if new_status not in ("resolved", "closed", "open", "in_progress"):
        raise HTTPException(status_code=400, detail="Invalid status. Use: resolved, closed, open, in_progress")

    query = select(SupportTicket).filter(SupportTicket.id == id)
    result = await db.execute(query)
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    status_map = {
        "resolved": TicketStatus.RESOLVED,
        "closed": TicketStatus.CLOSED,
        "open": TicketStatus.OPEN,
        "in_progress": TicketStatus.IN_PROGRESS,
    }
    ticket.status = status_map[new_status]
    ticket.updated_at = datetime.now(timezone.utc)

    # System message about status change
    status_labels = {"resolved": "Resolved", "closed": "Closed", "open": "Re-opened", "in_progress": "In Progress"}
    agent_name = ticket.assigned_agent or "Support Team"
    sys_msg = SupportMessage(
        ticket_id=ticket.id,
        sender_type="system",
        sender_name="Prescott National Bank Support",
        content=f"This conversation has been marked as {status_labels[new_status]} by {agent_name}."
            + (" You can no longer reply to this conversation. If you need further help, please create a new support request." if new_status in ("resolved", "closed") else ""),
        is_read=False
    )
    db.add(sys_msg)
    await db.commit()
    await db.refresh(sys_msg)

    # Broadcast status change via Ably
    try:
        msg_payload = {
            "id": str(sys_msg.id),
            "ticket_id": str(ticket.id),
            "sender_type": "system",
            "sender_name": sys_msg.sender_name,
            "content": sys_msg.content,
            "created_at": sys_msg.created_at.isoformat() if sys_msg.created_at else datetime.now(timezone.utc).isoformat(),
            "status_change": new_status,
        }
        await ably_service.publish_support_message(
            ticket_id=str(ticket.id),
            message_data=msg_payload,
            user_id=str(ticket.user_id)
        )
    except Exception as e:
        logger.warning(f"Failed to publish status change to Ably: {e}")

    return {"message": f"Ticket status updated to {new_status}", "status": new_status}

@router.get("/tickets/{id}")
async def get_admin_support_ticket(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to get a single support ticket and all messages."""
    from app.models.support import SupportTicket
    from sqlalchemy.orm import selectinload
    query = select(SupportTicket).options(selectinload(SupportTicket.messages)).filter(SupportTicket.id == id)
    result = await db.execute(query)
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {
        "id": ticket.id,
        "user_id": ticket.user_id,
        "category": ticket.category,
        "subject": ticket.subject,
        "message": ticket.message,
        "status": ticket.status,
        "admin_response": ticket.admin_response,
        "assigned_agent": ticket.assigned_agent,
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
        "messages": [
            {
                "id": m.id,
                "ticket_id": m.ticket_id,
                "sender_type": m.sender_type,
                "sender_name": m.sender_name,
                "content": m.content,
                "is_read": m.is_read,
                "created_at": m.created_at,
            }
            for m in sorted(ticket.messages, key=lambda msg: msg.created_at)
        ]
    }

@router.post("/tickets/{id}/reply")
async def reply_support_ticket(
    id: uuid.UUID,
    reply_data: SupportTicketReply,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to reply to a support ticket."""
    from app.models.support import SupportTicket, SupportMessage, TicketStatus
    from app.services.ably_service import ably_service
    from sqlalchemy.orm import selectinload
    from datetime import datetime, timezone

    query = select(SupportTicket).options(selectinload(SupportTicket.messages)).filter(SupportTicket.id == id)
    result = await db.execute(query)
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    ticket.admin_response = reply_data.admin_response
    if reply_data.status:
        s_val = str(reply_data.status).strip().lower()
        if s_val in ("resolved",):
            ticket.status = TicketStatus.RESOLVED
        elif s_val in ("close", "closed"):
            ticket.status = TicketStatus.CLOSED
        elif s_val in ("in_progress", "inprogress"):
            ticket.status = TicketStatus.IN_PROGRESS
        else:
            ticket.status = TicketStatus.OPEN

    # Determine the agent name for this message
    agent_display_name = (
        reply_data.agent_name
        or ticket.assigned_agent
        or "Support Team"
    )
    # Update assigned agent if provided
    if reply_data.agent_name:
        ticket.assigned_agent = reply_data.agent_name

    ticket.updated_at = datetime.now(timezone.utc)

    # Create admin support message with the agent's real name
    admin_msg = SupportMessage(
        ticket_id=ticket.id,
        sender_type="admin",
        sender_name=agent_display_name,
        content=reply_data.admin_response,
        is_read=False
    )
    db.add(admin_msg)
    await db.commit()
    await db.refresh(ticket)
    await db.refresh(admin_msg)

    # Broadcast in real time via Ably
    try:
        msg_payload = {
            "id": str(admin_msg.id),
            "ticket_id": str(ticket.id),
            "sender_type": "admin",
            "sender_name": admin_msg.sender_name,
            "content": admin_msg.content,
            "created_at": admin_msg.created_at.isoformat() if admin_msg.created_at else datetime.now(timezone.utc).isoformat(),
        }
        await ably_service.publish_support_message(
            ticket_id=str(ticket.id),
            message_data=msg_payload,
            user_id=str(ticket.user_id)
        )
    except Exception as e:
        logger.warning(f"Failed to publish admin support reply to Ably: {e}")

    # Re-query ticket with all messages to return clean serializable payload
    refreshed_query = select(SupportTicket).options(selectinload(SupportTicket.messages)).filter(SupportTicket.id == id)
    refreshed_res = await db.execute(refreshed_query)
    refreshed_ticket = refreshed_res.scalars().first() or ticket

    return {
        "id": refreshed_ticket.id,
        "user_id": refreshed_ticket.user_id,
        "category": refreshed_ticket.category,
        "subject": refreshed_ticket.subject,
        "message": refreshed_ticket.message,
        "status": refreshed_ticket.status,
        "admin_response": refreshed_ticket.admin_response,
        "assigned_agent": refreshed_ticket.assigned_agent,
        "created_at": refreshed_ticket.created_at,
        "updated_at": refreshed_ticket.updated_at,
        "messages": [
            {
                "id": m.id,
                "ticket_id": m.ticket_id,
                "sender_type": m.sender_type,
                "sender_name": m.sender_name,
                "content": m.content,
                "is_read": m.is_read,
                "created_at": m.created_at,
            }
            for m in sorted(refreshed_ticket.messages, key=lambda msg: msg.created_at)
        ]
    }

@router.get("/cards")
async def list_card_requests(
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to list all virtual card requests."""
    offset = (page - 1) * page_size
    query = select(VirtualCard).order_by(desc(VirtualCard.created_at)).offset(offset).limit(page_size)
    result = await db.execute(query)
    cards = result.scalars().all()
    
    output = []
    for c in cards:
        user_res = await db.execute(select(User).filter(User.id == c.user_id))
        user = user_res.scalars().first()
        raw_number = decrypt_val(c.card_number_encrypted) or "4000000000000000"
        output.append({
            "id": c.id,
            "user_id": c.user_id,
            "user_email": user.email if user else "Unknown",
            "cardholder_name": user.full_name if user else "Unknown",
            "last4": raw_number[-4:],
            "status": c.status.value if hasattr(c.status, "value") else str(c.status),
            "funding_amount": float(c.funding_amount),
            "source_account": c.source_account,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "approved_at": c.approved_at.isoformat() if c.approved_at else None
        })
    return output

@router.post("/cards/{id}/review")
async def review_card_request(
    id: uuid.UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to approve or reject a virtual card request with account refund on rejection."""
    action = payload.get("action", "").lower()
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")

    query = select(VirtualCard).filter(VirtualCard.id == id).with_for_update()
    result = await db.execute(query)
    card = result.scalars().first()
    if not card:
        raise HTTPException(status_code=404, detail="Card request not found")

    if card.status not in [CardStatus.PENDING, CardStatus.PROCESSING]:
        raise HTTPException(status_code=400, detail="Card request has already been finalized")

    acc_query = await db.execute(select(Account).filter(Account.user_id == card.user_id).with_for_update())
    user_account = acc_query.scalars().first()

    if action == "approve":
        card.status = CardStatus.PROCESSING
        card.approved_at = datetime.datetime.utcnow()
    else:
        # Rejection: Refund funding amount back to user's chosen account (Checking or Savings)
        if user_account:
            source = (card.source_account or "checking").lower()
            refund_amt = Decimal(str(card.funding_amount))
            if source == "checking":
                user_account.checking_balance += refund_amt
            else:
                user_account.savings_balance += refund_amt
            user_account.balance = user_account.checking_balance + user_account.savings_balance + user_account.credit_balance
            db.add(user_account)
        card.status = CardStatus.REJECTED

    await db.commit()
    return {"message": f"Card request {action}d successfully"}

@router.get("/loans")
async def list_user_loans(
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to list all user loan applications."""
    from app.models.loan import Loan
    offset = (page - 1) * page_size
    query = select(Loan).order_by(desc(Loan.created_at)).offset(offset).limit(page_size)
    result = await db.execute(query)
    loans = result.scalars().all()

    output = []
    for l in loans:
        user_res = await db.execute(select(User).filter(User.id == l.user_id))
        user = user_res.scalars().first()
        output.append({
            "id": l.id,
            "user_id": l.user_id,
            "user_email": user.email if user else "Unknown",
            "applicant_name": user.full_name if user else "Unknown",
            "amount": float(l.amount),
            "term_months": l.term_months,
            "interest_rate": float(l.interest_rate),
            "monthly_payment": float(l.monthly_payment),
            "total_repayment": float(l.total_repayment),
            "remaining_balance": float(l.remaining_balance),
            "employment_status": l.employment_status,
            "destination_account": l.destination_account,
            "status": l.status.value if hasattr(l.status, "value") else str(l.status),
            "rejection_reason": l.rejection_reason,
            "created_at": l.created_at.isoformat() if l.created_at else None,
            "approved_at": l.approved_at.isoformat() if l.approved_at else None
        })
    return output

@router.post("/loans/{id}/review")
async def review_loan_application(
    id: uuid.UUID,
    payload: dict,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to approve or decline a loan application with instant funding and email notification."""
    from app.models.loan import Loan, LoanStatus
    from app.services.loan_email_service import send_loan_approval_email, send_loan_rejection_email
    from app.services.notification_service import notification_service

    action = payload.get("action", "").lower()
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")

    query = select(Loan).filter(Loan.id == id).with_for_update()
    result = await db.execute(query)
    loan = result.scalars().first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan application not found")

    if loan.status != LoanStatus.PENDING:
        raise HTTPException(status_code=400, detail="Loan application has already been finalized")

    user_res = await db.execute(select(User).filter(User.id == loan.user_id))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Applicant user profile not found")

    acc_query = await db.execute(select(Account).filter(Account.user_id == loan.user_id).with_for_update())
    user_account = acc_query.scalars().first()

    symbol = "£" if user_account and user_account.currency.value == "GBP" else "$"

    if action == "approve":
        loan.status = LoanStatus.APPROVED
        loan.approved_at = datetime.datetime.utcnow()

        if user_account:
            source = (loan.destination_account or "checking").lower()
            credit_amt = Decimal(str(loan.amount))
            if source == "checking":
                user_account.checking_balance += credit_amt
            else:
                user_account.savings_balance += credit_amt
            user_account.balance = user_account.checking_balance + user_account.savings_balance + user_account.credit_balance
            db.add(user_account)

            tx = Transaction(
                to_account_id=user_account.id,
                from_account_id=None,
                type=TransactionType.DEPOSIT,
                amount=credit_amt,
                currency=user_account.currency,
                status=TransactionStatus.COMPLETED,
                memo=f"Personal Loan Disbursement to {source.capitalize()}"
            )
            db.add(tx)

        background_tasks.add_task(
            send_loan_approval_email,
            email=user.email,
            full_name=user.full_name,
            amount=float(loan.amount),
            destination_account=loan.destination_account,
            symbol=symbol
        )
        background_tasks.add_task(
            notification_service.create_notification,
            db=db,
            user_id=user.id,
            type="transfer",
            title="Loan Approved & Funded",
            message=f"Your personal loan of {symbol}{loan.amount:,.2f} has been approved and credited to your {loan.destination_account} account."
        )
    else:
        reason = payload.get("rejection_reason", "Did not meet system credit compliance guidelines.").strip()
        loan.status = LoanStatus.REJECTED
        loan.rejection_reason = reason

        background_tasks.add_task(
            send_loan_rejection_email,
            email=user.email,
            full_name=user.full_name,
            amount=float(loan.amount),
            rejection_reason=reason,
            symbol=symbol
        )
        background_tasks.add_task(
            notification_service.create_notification,
            db=db,
            user_id=user.id,
            type="transfer",
            title="Loan Application Notice",
            message=f"Your loan request for {symbol}{loan.amount:,.2f} was declined: {reason}"
        )

    await db.commit()
    return {"message": f"Loan application {action}d successfully"}

@router.get("/tax/payments")
async def list_admin_tax_payments(
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to list all IRS federal tax payments submitted by users."""
    from app.models.tax import TaxPayment
    offset = (page - 1) * page_size
    query = select(TaxPayment).order_by(desc(TaxPayment.created_at)).offset(offset).limit(page_size)
    result = await db.execute(query)
    pmts = result.scalars().all()

    output = []
    for p in pmts:
        user_res = await db.execute(select(User).filter(User.id == p.user_id))
        user = user_res.scalars().first()
        output.append({
            "id": str(p.id),
            "user_id": str(p.user_id),
            "user_email": user.email if user else "Unknown",
            "applicant_name": user.full_name if user else "Unknown",
            "tax_year": p.tax_year,
            "payment_type": p.payment_type,
            "amount": float(p.amount),
            "source_account": p.source_account,
            "status": p.status,
            "irs_confirmation_number": p.irs_confirmation_number,
            "created_at": p.created_at.isoformat() if p.created_at else None
        })
    return output

@router.get("/tax/compliance")
async def get_admin_tax_compliance(db: AsyncSession = Depends(get_db)):
    """Admin endpoint to retrieve TIN verification rates and annual 1099 interest summary metrics."""
    from app.models.tax import W9Certification, TaxPayment
    w9_res = await db.execute(select(func.count(W9Certification.id)))
    verified_w9s = w9_res.scalar() or 0

    user_res = await db.execute(select(func.count(User.id)))
    total_users = user_res.scalar() or 1

    pmt_sum_res = await db.execute(select(func.sum(TaxPayment.amount)))
    total_tax_paid = pmt_sum_res.scalar() or 0.0

    return {
        "verified_w9_count": verified_w9s,
        "total_users": total_users,
        "w9_compliance_rate": round((verified_w9s / total_users) * 100, 1),
        "total_federal_tax_paid": float(total_tax_paid),
        "tax_year": "2026",
        "backup_withholding_rate": "24.0%"
    }

@router.post("/tax/refunds/issue")
async def issue_admin_irs_refund(
    payload: dict,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to create or update an IRS tax refund. Marking as 'deposited' credits user checking balance."""
    from app.models.tax import IrsRefund
    from app.services.notification_service import notification_service

    email = payload.get("user_email", "").strip()
    amount = float(payload.get("refund_amount", 0.0))
    status_val = payload.get("status", "approved").lower()
    tax_year = str(payload.get("tax_year", "2025"))

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Refund amount must be greater than zero")

    user_res = await db.execute(select(User).filter(User.email == email))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User with email '{email}' not found")

    refund_query = await db.execute(
        select(IrsRefund)
        .filter(IrsRefund.user_id == user.id)
        .order_by(desc(IrsRefund.created_at))
    )
    refund = refund_query.scalars().first()

    already_deposited = refund and refund.status == "deposited"

    if not refund:
        refund = IrsRefund(
            user_id=user.id,
            refund_amount=amount,
            tax_year=tax_year,
            status=status_val,
            estimated_deposit_date="Aug 12, 2026"
        )
        db.add(refund)
    else:
        refund.refund_amount = amount
        refund.tax_year = tax_year
        refund.status = status_val

    if status_val == "deposited" and not already_deposited:
        refund.deposited_at = datetime.datetime.utcnow()
        acc_query = await db.execute(select(Account).filter(Account.user_id == user.id).with_for_update())
        user_account = acc_query.scalars().first()
        if user_account:
            credit_amt = Decimal(str(amount))
            user_account.checking_balance += credit_amt
            user_account.balance = user_account.checking_balance + user_account.savings_balance + user_account.credit_balance
            db.add(user_account)

            symbol = "£" if user_account.currency.value == "GBP" else "$"

            tx = Transaction(
                to_account_id=user_account.id,
                from_account_id=None,
                type=TransactionType.DEPOSIT,
                amount=credit_amt,
                currency=user_account.currency,
                status=TransactionStatus.COMPLETED,
                memo=f"IRS Federal Tax Refund Deposit ({tax_year})"
            )
            db.add(tx)

            background_tasks.add_task(
                notification_service.create_notification,
                db=db,
                user_id=user.id,
                type="deposit",
                title="IRS Tax Refund Deposited",
                message=f"Your IRS Tax Refund of {symbol}{amount:,.2f} has been deposited to your Checking Account."
            )

    await db.commit()
    return {"message": f"IRS Refund updated to '{status_val}' successfully"}




