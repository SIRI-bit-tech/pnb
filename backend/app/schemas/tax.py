import uuid
import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class TaxPaymentPayload(BaseModel):
    tax_year: str = "2026"
    payment_type: str = Field(..., description="1040_estimated, balance_due, extension")
    amount: float = Field(..., gt=0)
    source_account: str = Field(default="checking", description="checking or savings")

class TaxPaymentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    tax_year: str
    payment_type: str
    amount: float
    source_account: str
    status: str
    irs_confirmation_number: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TaxDocumentResponse(BaseModel):
    id: uuid.UUID
    tax_year: str
    document_type: str
    description: str
    total_amount: float
    pdf_url: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class W9Payload(BaseModel):
    ssn_last4: str = Field(..., min_length=4, max_length=4)
    tax_classification: str = Field(default="Individual/Sole proprietor")
    signature_name: str

class W9Response(BaseModel):
    id: uuid.UUID
    ssn_last4: str
    tax_classification: str
    signature_name: str
    status: str
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class IrsRefundResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    refund_amount: float
    tax_year: str
    status: str
    estimated_deposit_date: str
    created_at: datetime.datetime
    deposited_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class NotifyRefundPayload(BaseModel):
    refund_amount: float = Field(..., gt=0)
    tax_year: str = Field(default="2025")

class TaxOverviewResponse(BaseModel):
    routing_number: str
    account_number: str
    checking_account_number: Optional[str] = None
    savings_account_number: Optional[str] = None
    w9: Optional[W9Response] = None
    refund: Optional[IrsRefundResponse] = None
    recent_payments: List[TaxPaymentResponse] = []
