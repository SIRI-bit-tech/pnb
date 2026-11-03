import uuid
from decimal import Decimal
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from app.models.card import CardStatus
from app.models.support import TicketStatus
from app.models.user import CountryType

class AdminConfigResponse(BaseModel):
    key: str
    value: str
    updated_at: datetime

    class Config:
        from_attributes = True

class AdminConfigUpdate(BaseModel):
    value: str

class DailyTrendResponse(BaseModel):
    name: str
    deposits: float
    transfers: float

class AnalyticsResponse(BaseModel):
    total_users: int
    total_deposits_amount: Decimal
    pending_deposits_count: int
    avg_deposit_processing_time_seconds: float
    total_transactions_count: int
    total_active_cards: int
    transactions_today_count: int
    open_support_tickets_count: int
    daily_trends: List[DailyTrendResponse]

    class Config:
        from_attributes = True

class VirtualCardResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    card_number_masked: Optional[str] = None
    expiry: Optional[str] = None
    cvv_masked: Optional[str] = None
    status: CardStatus
    created_at: datetime

    class Config:
        from_attributes = True

class CardStatusUpdate(BaseModel):
    status: CardStatus
    card_number: Optional[str] = Field(None, description="Actual card number if status is completed")
    expiry: Optional[str] = Field(None, description="MM/YY format")
    cvv: Optional[str] = Field(None, description="3-digit CVV")

class SupportTicketResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category: Optional[str] = None
    subject: str
    message: str
    status: TicketStatus
    admin_response: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SupportTicketReply(BaseModel):
    admin_response: str
    status: Optional[str] = "resolved"
    agent_name: Optional[str] = None

class UserBanRequest(BaseModel):
    is_active: bool
    ban_reason: Optional[str] = None

class AdminUserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    dob: Optional[str] = None
    sex: Optional[str] = None
    country: Optional[CountryType] = None
    state: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None
    created_at: Optional[datetime] = None
    profile_image_url: Optional[str] = None

class AccountBalanceUpdate(BaseModel):
    checking_amount: Optional[Decimal] = None
    savings_amount: Optional[Decimal] = None
    credit_amount: Optional[Decimal] = None
    description: Optional[str] = "Admin balance adjustment"

class AccountFreezeRequest(BaseModel):
    is_frozen: bool
    freeze_reason: Optional[str] = None

class GenerateTransactionsRequest(BaseModel):
    user_id: uuid.UUID
    starting_balance: Decimal = Field(..., ge=Decimal("0.00"))
    closing_balance: Decimal = Field(..., ge=Decimal("0.00"))
    days: Optional[int] = Field(60, ge=1, le=10000)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    split_ratio: Decimal = Field(Decimal("0.50"), ge=Decimal("0.00"), le=Decimal("1.00"))
    transaction_count: int = Field(25, ge=1, le=1000)

class AirlineBookingTransactionRequest(BaseModel):
    user_id: uuid.UUID
    airline_name: str = Field(..., min_length=2, max_length=100)
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    currency: Optional[str] = "USD"
    booking_reference: Optional[str] = Field(None, max_length=50)
    ticket_number: Optional[str] = Field(None, max_length=50)
    flight_route: Optional[str] = Field(None, max_length=150)
    cabin_class: Optional[str] = Field("Economy", max_length=50)
    passenger_name: Optional[str] = Field(None, max_length=100)
    payment_method: Optional[str] = Field("checking", max_length=50)
    status: Optional[str] = Field("completed", max_length=20)
    date: Optional[str] = None  # ISO format string or YYYY-MM-DD HH:MM
    bank_or_processor: Optional[str] = Field(None, max_length=150)
    memo: Optional[str] = Field(None, max_length=255)

