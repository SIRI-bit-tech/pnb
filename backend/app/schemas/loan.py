import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.loan import LoanStatus

class LoanApplyPayload(BaseModel):
    amount: float = Field(..., gt=0, description="Loan amount requested ($1,000 to $100,000)")
    term_months: int = Field(..., description="Loan term in months (12 to 60)")
    employment_status: str = Field(..., description="Employment status (Employed, Self-Employed, Business Owner, Retired, Other)")
    destination_account: str = Field("checking", description="Account to receive loan funds: 'checking' or 'savings'")

class LoanPaymentResponse(BaseModel):
    id: uuid.UUID
    amount: float
    principal: float
    interest: float
    status: str
    payment_date: datetime

    class Config:
        from_attributes = True

class LoanResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    amount: float
    term_months: int
    interest_rate: float
    monthly_payment: float
    total_repayment: float
    remaining_balance: float
    employment_status: str
    destination_account: str
    status: LoanStatus
    autopay_enabled: bool = True
    rejection_reason: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    payments: List[LoanPaymentResponse] = []
    paid_amount: float = 0.0
    payoff_percentage: float = 0.0

    class Config:
        from_attributes = True

class LoanPaymentPayload(BaseModel):
    amount: float = Field(..., gt=0)
    source_account: str = Field("checking")

class AdminLoanReviewPayload(BaseModel):
    action: str = Field(..., description="'approve' or 'reject'")
    rejection_reason: Optional[str] = Field(None, description="Required when action is 'reject'")
