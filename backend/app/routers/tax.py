import random
import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.user import User, Account
from app.models.tax import TaxPayment, TaxDocument, W9Certification, IrsRefund
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.schemas.tax import (
    TaxPaymentPayload, TaxPaymentResponse, TaxDocumentResponse,
    W9Payload, W9Response, IrsRefundResponse, TaxOverviewResponse,
    NotifyRefundPayload
)
from app.middleware.auth import get_current_user
from app.services.tax_email_service import send_tax_payment_receipt_email

router = APIRouter(prefix="/tax", tags=["IRS Tax & Refund Hub"])

@router.get("/overview", response_model=TaxOverviewResponse)
async def get_tax_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves IRS Direct Deposit credentials, refund status, W9 status, and payment history."""
    acc_query = await db.execute(select(Account).filter(Account.user_id == current_user.id))
    account = acc_query.scalars().first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    w9_query = await db.execute(select(W9Certification).filter(W9Certification.user_id == current_user.id))
    w9 = w9_query.scalars().first()

    refund_query = await db.execute(
        select(IrsRefund)
        .filter(IrsRefund.user_id == current_user.id)
        .order_by(IrsRefund.created_at.desc())
    )
    refund = refund_query.scalars().first()

    pmt_query = await db.execute(
        select(TaxPayment)
        .filter(TaxPayment.user_id == current_user.id)
        .order_by(TaxPayment.created_at.desc())
    )
    pmts = pmt_query.scalars().all()

    return TaxOverviewResponse(
        routing_number=account.routing_number or "121175254",
        account_number=account.checking_account_number or account.account_number or "4820194820",
        checking_account_number=account.checking_account_number,
        savings_account_number=account.savings_account_number,
        w9=W9Response.model_validate(w9) if w9 else None,
        refund=IrsRefundResponse.model_validate(refund) if refund else None,
        recent_payments=[TaxPaymentResponse.model_validate(p) for p in pmts]
    )

@router.get("/documents", response_model=List[TaxDocumentResponse])
async def get_tax_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns auto-calculated IRS tax forms (1099-INT, 1099-DIV, 1099-B, 1098)."""
    acc_query = await db.execute(select(Account).filter(Account.user_id == current_user.id))
    account = acc_query.scalars().first()

    doc_query = await db.execute(
        select(TaxDocument)
        .filter(TaxDocument.user_id == current_user.id)
        .order_by(TaxDocument.tax_year.desc())
    )
    existing_docs = doc_query.scalars().all()
    if existing_docs:
        return [TaxDocumentResponse.model_validate(d) for d in existing_docs]

    # Auto-generate standard tax forms if none exist
    sav_bal = float(account.savings_balance) if account else 5000.0
    interest_earned = round(sav_bal * 0.0425, 2)  # 4.25% High-Yield APY

    default_docs = [
        TaxDocument(
            user_id=current_user.id,
            tax_year="2025",
            document_type="1099-INT",
            description="Interest Income from High-Yield Savings Account",
            total_amount=max(42.50, interest_earned)
        ),
        TaxDocument(
            user_id=current_user.id,
            tax_year="2025",
            document_type="1099-DIV",
            description="Dividends and Distributions from Securities",
            total_amount=128.40
        ),
        TaxDocument(
            user_id=current_user.id,
            tax_year="2025",
            document_type="1099-B",
            description="Proceeds From Broker & Stock Capital Gains Transactions",
            total_amount=340.00
        ),
    ]
    for d in default_docs:
        db.add(d)
    await db.commit()

    return [TaxDocumentResponse.model_validate(d) for d in default_docs]

@router.post("/pay-irs", response_model=TaxPaymentResponse, status_code=status.HTTP_201_CREATED)
async def submit_irs_tax_payment(
    data: TaxPaymentPayload,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submits electronic federal tax payment to IRS."""
    acc_query = await db.execute(select(Account).filter(Account.user_id == current_user.id).with_for_update())
    account = acc_query.scalars().first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    source = (data.source_account or "checking").lower()
    avail = float(account.checking_balance) if source == "checking" else float(account.savings_balance)
    if data.amount > avail:
        raise HTTPException(status_code=400, detail=f"Insufficient balance in {source} account")

    amount_dec = Decimal(str(data.amount))
    if source == "checking":
        account.checking_balance -= amount_dec
    else:
        account.savings_balance -= amount_dec
    account.balance = account.checking_balance + account.savings_balance + account.credit_balance

    conf_num = f"IRS-{data.tax_year}-{random.randint(100000, 999999)}"

    tx = Transaction(
        from_account_id=account.id,
        type=TransactionType.WIRE,
        amount=amount_dec,
        currency=account.currency,
        status=TransactionStatus.COMPLETED,
        memo=f"IRS Federal Tax Payment ({data.payment_type}) Ref: {conf_num}"
    )
    db.add(tx)

    pmt = TaxPayment(
        user_id=current_user.id,
        tax_year=data.tax_year,
        payment_type=data.payment_type,
        amount=data.amount,
        source_account=source,
        status="completed",
        irs_confirmation_number=conf_num
    )
    db.add(pmt)
    await db.commit()
    await db.refresh(pmt)

    symbol = "£" if account.currency.value == "GBP" else "$"

    background_tasks.add_task(
        send_tax_payment_receipt_email,
        email=current_user.email,
        full_name=current_user.full_name,
        amount=data.amount,
        payment_type=data.payment_type,
        irs_confirmation_number=conf_num,
        source_account=source,
        symbol=symbol
    )

    return TaxPaymentResponse.model_validate(pmt)

@router.post("/w9", response_model=W9Response)
async def submit_w9_certification(
    data: W9Payload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submits or updates user W-9 tax certification details."""
    w9_query = await db.execute(select(W9Certification).filter(W9Certification.user_id == current_user.id))
    w9 = w9_query.scalars().first()

    if w9:
        w9.ssn_last4 = data.ssn_last4
        w9.tax_classification = data.tax_classification
        w9.signature_name = data.signature_name
        w9.status = "verified"
        w9.updated_at = datetime.datetime.utcnow()
    else:
        w9 = W9Certification(
            user_id=current_user.id,
            ssn_last4=data.ssn_last4,
            tax_classification=data.tax_classification,
            signature_name=data.signature_name,
            status="verified"
        )
        db.add(w9)

    await db.commit()
    await db.refresh(w9)
    return W9Response.model_validate(w9)

@router.post("/refunds/notify", response_model=IrsRefundResponse, status_code=status.HTTP_201_CREATED)
async def notify_expected_irs_refund(
    data: NotifyRefundPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Allows user to submit expected IRS refund amount, switching tracker to Active Deposit mode."""
    refund_query = await db.execute(
        select(IrsRefund)
        .filter(IrsRefund.user_id == current_user.id)
        .order_by(IrsRefund.created_at.desc())
    )
    refund = refund_query.scalars().first()

    if refund and refund.status != "deposited":
        refund.refund_amount = data.refund_amount
        refund.tax_year = data.tax_year
        refund.status = "approved"
    else:
        refund = IrsRefund(
            user_id=current_user.id,
            refund_amount=data.refund_amount,
            tax_year=data.tax_year,
            status="approved",
            estimated_deposit_date="Aug 12, 2026"
        )
        db.add(refund)

    await db.commit()
    await db.refresh(refund)
    return IrsRefundResponse.model_validate(refund)

