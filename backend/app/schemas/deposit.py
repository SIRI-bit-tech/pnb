import uuid
from decimal import Decimal
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.deposit import DepositType, DepositStatus

class DepositSubmitRequest(BaseModel):
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    reference_id: Optional[str] = Field(None, max_length=255)

class DepositResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: DepositType
    amount: Decimal
    status: DepositStatus
    admin_notes: Optional[str] = None
    image_front_url: Optional[str] = None
    image_back_url: Optional[str] = None
    reference_id: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AdminDepositReviewRequest(BaseModel):
    status: DepositStatus = Field(..., description="Must be confirmed or rejected")
    admin_notes: Optional[str] = Field(None, max_length=500)

class DepositListResponse(BaseModel):
    deposits: List[DepositResponse]
    total_count: int
