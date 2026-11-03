import uuid
import datetime
import math
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, Account
from app.models.loan import Loan, LoanStatus, LoanPayment
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.schemas.loan import LoanApplyPayload, LoanResponse, LoanPaymentPayload, LoanPaymentResponse
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/loans", tags=["Personal Loans"])

def get_tiered_interest_rate(amount: float) -> float:
    """
    Tiered APR Rates:
    - Below $10,000 (< 10000): 10.0% APR
    - From $10,000 to $50,000 (10000 to 50000): 20.0% APR
    - Above $50,000 (> 50000): 25.0% APR
    """
    if amount < 10000:
        return 10.0
    elif amount <= 50000:
        return 20.0
    else:
        return 25.0

def calculate_loan_terms(amount: float, term_months: int, apr_rate: Optional[float] = None):
    if apr_rate is None:
        apr_rate = get_tiered_interest_rate(amount)
    r = (apr_rate / 100.0) / 12.0
    n = term_months
    monthly = (amount * r * ((1 + r) ** n)) / (((1 + r) ** n) - 1)
    total = monthly * n
    return round(monthly, 2), round(total, 2)

@router.get("", response_model=Optional[LoanResponse])
async def get_user_loan(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves current user's active/pending loan application and payments."""
    query = await db.execute(
        select(Loan)
        .options(selectinload(Loan.payments))
        .filter(Loan.user_id == current_user.id)
        .order_by(Loan.created_at.desc())
    )
    loan = query.scalars().first()
    if not loan:
        return None

    paid_amt = sum(p.amount for p in loan.payments) if loan.payments else 0.0
    payoff_pct = round((paid_amt / loan.total_repayment * 100.0), 1) if loan.total_repayment > 0 else 0.0

    return LoanResponse(
        id=loan.id,
        user_id=loan.user_id,
        amount=float(loan.amount),
        term_months=loan.term_months,
        interest_rate=float(loan.interest_rate),
        monthly_payment=float(loan.monthly_payment),
        total_repayment=float(loan.total_repayment),
        remaining_balance=float(loan.remaining_balance),
        employment_status=loan.employment_status,
        destination_account=loan.destination_account,
        status=loan.status,
        autopay_enabled=bool(getattr(loan, "autopay_enabled", True)),
        rejection_reason=loan.rejection_reason,
        approved_at=loan.approved_at,
        created_at=loan.created_at,
        payments=[
            LoanPaymentResponse(
                id=p.id,
                amount=float(p.amount),
                principal=float(p.principal),
                interest=float(p.interest),
                status=p.status,
                payment_date=p.payment_date
            ) for p in (loan.payments or [])
        ],
        paid_amount=round(paid_amt, 2),
        payoff_percentage=min(100.0, payoff_pct)
    )

@router.post("/apply", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
async def apply_for_loan(
    data: LoanApplyPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submits a new personal loan application."""
    acc_query = await db.execute(select(Account).filter(Account.user_id == current_user.id))
    user_account = acc_query.scalars().first()
    if not user_account:
        raise HTTPException(status_code=404, detail="User account profile not found")

    # Check for existing pending/approved loans
    existing_query = await db.execute(
        select(Loan).filter(
            Loan.user_id == current_user.id,
            Loan.status.in_([LoanStatus.PENDING.value, LoanStatus.APPROVED.value, LoanStatus.PENDING, LoanStatus.APPROVED])
        )
    )
    if existing_query.scalars().first():
        raise HTTPException(status_code=400, detail="You already have an active or pending loan application.")

    apr_rate = get_tiered_interest_rate(data.amount)
    monthly_pmt, total_repay = calculate_loan_terms(data.amount, data.term_months, apr_rate)
    source = (data.destination_account or "checking").lower()

    new_loan = Loan(
        user_id=current_user.id,
        amount=data.amount,
        term_months=data.term_months,
        interest_rate=apr_rate,
        monthly_payment=monthly_pmt,
        total_repayment=total_repay,
        remaining_balance=total_repay,
        employment_status=data.employment_status,
        destination_account=source,
        status=LoanStatus.PENDING
    )
    db.add(new_loan)
    await db.commit()
    await db.refresh(new_loan)

    return LoanResponse(
        id=new_loan.id,
        user_id=new_loan.user_id,
        amount=float(new_loan.amount),
        term_months=new_loan.term_months,
        interest_rate=float(new_loan.interest_rate),
        monthly_payment=float(new_loan.monthly_payment),
        total_repayment=float(new_loan.total_repayment),
        remaining_balance=float(new_loan.remaining_balance),
        employment_status=new_loan.employment_status,
        destination_account=new_loan.destination_account,
        status=new_loan.status,
        rejection_reason=None,
        approved_at=None,
        created_at=new_loan.created_at,
        payments=[],
        paid_amount=0.0,
        payoff_percentage=0.0
    )

@router.post("/{loan_id}/pay", response_model=LoanResponse)
async def make_loan_payment(
    loan_id: str,
    data: LoanPaymentPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Executes a repayment installment towards an active loan."""
    import uuid
    try:
        l_id = uuid.UUID(loan_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid loan ID")

    query = await db.execute(
        select(Loan)
        .options(selectinload(Loan.payments))
        .filter(Loan.id == l_id, Loan.user_id == current_user.id)
    )
    loan = query.scalars().first()
    if not loan or loan.status != LoanStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Active approved loan not found")

    acc_query = await db.execute(select(Account).filter(Account.user_id == current_user.id))
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

    interest_part = round(data.amount * 0.15, 2)
    principal_part = round(data.amount - interest_part, 2)

    loan.remaining_balance = max(0.0, float(loan.remaining_balance) - data.amount)
    if loan.remaining_balance <= 0.01:
        loan.status = LoanStatus.PAID_OFF

    pmt = LoanPayment(
        loan_id=loan.id,
        amount=data.amount,
        principal=principal_part,
        interest=interest_part,
        status="cleared",
        payment_date=datetime.datetime.utcnow()
    )
    db.add(pmt)
    await db.commit()
    await db.refresh(loan)

    paid_amt = sum(p.amount for p in loan.payments) if loan.payments else 0.0
    payoff_pct = round((paid_amt / loan.total_repayment * 100.0), 1) if loan.total_repayment > 0 else 0.0

    return LoanResponse(
        id=loan.id,
        user_id=loan.user_id,
        amount=float(loan.amount),
        term_months=loan.term_months,
        interest_rate=float(loan.interest_rate),
        monthly_payment=float(loan.monthly_payment),
        total_repayment=float(loan.total_repayment),
        remaining_balance=float(loan.remaining_balance),
        employment_status=loan.employment_status,
        destination_account=loan.destination_account,
        status=loan.status,
        rejection_reason=loan.rejection_reason,
        approved_at=loan.approved_at,
        created_at=loan.created_at,
        payments=[
            LoanPaymentResponse(
                id=p.id,
                amount=float(p.amount),
                principal=float(p.principal),
                interest=float(p.interest),
                status=p.status,
                payment_date=p.payment_date
            ) for p in (loan.payments or [])
        ],
        paid_amount=round(paid_amt, 2),
        payoff_percentage=min(100.0, payoff_pct)
    )

@router.patch("/{id}/autopay")
async def toggle_loan_autopay(
    id: uuid.UUID,
    payload: dict,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Live endpoint to toggle Autopay ON or OFF for an active personal loan."""
    from app.services.notification_service import notification_service
    query = await db.execute(select(Loan).filter(Loan.id == id, Loan.user_id == current_user.id).with_for_update())
    loan = query.scalars().first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    new_state = bool(payload.get("enabled", not getattr(loan, "autopay_enabled", True)))
    loan.autopay_enabled = new_state
    db.add(loan)
    await db.commit()

    title_str = "Autopay Enabled" if new_state else "Autopay Paused"
    msg_str = f"Automatic monthly payments of ${loan.monthly_payment:,.2f} are now {'active' if new_state else 'paused'} for your personal loan."

    background_tasks.add_task(
        notification_service.create_notification,
        db=db,
        user_id=current_user.id,
        type="deposit",
        title=title_str,
        message=msg_str
    )

    return {"message": title_str, "autopay_enabled": new_state}

