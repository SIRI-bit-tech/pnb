import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class CardRequestPayload(BaseModel):
    amount: float = Field(..., gt=0, description="Initial funding balance for the virtual card")
    source_account: str = Field("checking", description="Account to fund from: 'checking' or 'savings'")

class CardResponse(BaseModel):
    id: uuid.UUID
    card_number: str
    last4: str
    expiry: str
    cvv: str
    status: str
    is_frozen: bool
    cardholder_name: str
    balance: float
    funding_amount: float
    source_account: str
    approved_at: Optional[datetime] = None
    activation_delay_hours: int = 1
    activation_remaining_minutes: int = 0

    class Config:
        from_attributes = True
