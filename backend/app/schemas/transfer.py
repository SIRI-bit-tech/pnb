import uuid
from decimal import Decimal
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.transaction import TransactionType, TransactionStatus
from app.models.user import CurrencyType

class P2PTransferRequest(BaseModel):
    recipient_username: str = Field(..., min_length=3, max_length=50)
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    memo: Optional[str] = Field(None, max_length=255)
    pin: str = Field(..., min_length=4, max_length=4)

class ExternalTransferRequest(BaseModel):
    type: str = Field(..., description="ach or wire")
    routing_number: str = Field(..., min_length=9, max_length=9)
    account_number: str = Field(..., min_length=4, max_length=17)
    bank_name: str = Field(..., min_length=2, max_length=100)
    account_name: str = Field(..., min_length=2, max_length=100)
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    from_account_type: Optional[str] = Field("checking", description="checking or savings")
    memo: Optional[str] = Field(None, max_length=255)
    pin: str = Field(..., min_length=4, max_length=4)

class InternationalTransferRequest(BaseModel):
    beneficiary_name: str = Field(..., min_length=2, max_length=150)
    beneficiary_address: Optional[str] = Field(None, max_length=255)
    beneficiary_country: str = Field(..., min_length=2, max_length=100)
    iban_or_account: str = Field(..., min_length=4, max_length=50)
    swift_bic: str = Field(..., min_length=8, max_length=11)
    bank_name: str = Field(..., min_length=2, max_length=150)
    bank_city: Optional[str] = Field(None, max_length=100)
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    currency: Optional[str] = Field("USD", max_length=10)
    from_account_type: Optional[str] = Field("checking", description="checking or savings")
    memo: Optional[str] = Field(None, max_length=255)
    pin: str = Field(..., min_length=4, max_length=4)

class RoutingVerifyResponse(BaseModel):
    valid: bool
    bank_name: Optional[str] = None
    error: Optional[str] = None

class TransferResponse(BaseModel):
    id: uuid.UUID
    from_account_id: Optional[uuid.UUID]
    to_account_id: Optional[uuid.UUID]
    type: TransactionType
    amount: Decimal
    currency: CurrencyType
    status: TransactionStatus
    routing_number: Optional[str]
    external_bank_name: Optional[str] = None
    external_account_number: Optional[str] = None
    external_account_name: Optional[str] = None
    fee: Decimal = Decimal("0.0000")
    direction: Optional[str] = "debit"
    memo: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionDetail(BaseModel):
    id: uuid.UUID
    type: str
    direction: str
    amount: Decimal
    currency: str
    status: str
    memo: Optional[str]
    created_at: datetime
    sender_username: Optional[str] = None
    sender_full_name: Optional[str] = None
    recipient_username: Optional[str] = None
    recipient_full_name: Optional[str] = None
    external_bank_name: Optional[str] = None
    external_account_number: Optional[str] = None
    external_account_name: Optional[str] = None
    fee: Decimal = Decimal("0.0000")

class TransactionListResponse(BaseModel):
    transactions: List[TransactionDetail]
    total_count: int
    page: int
    page_size: int
