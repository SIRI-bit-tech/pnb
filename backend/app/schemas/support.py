import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.support import TicketStatus

class SupportTopic(BaseModel):
    id: str
    name: str
    icon: str
    description: str
    badge: Optional[str] = None
    typical_response_time: str = "< 2 mins"

class SupportMessageResponse(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    sender_type: str  # 'user', 'admin', 'system'
    sender_name: str
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SupportMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)

class SupportTicketCreate(BaseModel):
    category: str = Field(..., min_length=2, max_length=100)
    subject: str = Field(..., min_length=2, max_length=150)
    message: str = Field(..., min_length=2, max_length=5000)

class SupportTicketListItem(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category: Optional[str] = None
    subject: str
    status: TicketStatus
    created_at: datetime
    updated_at: datetime
    last_message: Optional[str] = None
    last_sender: Optional[str] = None
    unread_count: int = 0

    class Config:
        from_attributes = True

class SupportTicketDetailResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category: Optional[str] = None
    subject: str
    message: str
    status: TicketStatus
    admin_response: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: List[SupportMessageResponse] = []

    class Config:
        from_attributes = True
