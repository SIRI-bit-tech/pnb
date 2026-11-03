import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.notification import NotificationType

class NotificationResponse(BaseModel):
    id: uuid.UUID
    type: NotificationType
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationPreferenceResponse(BaseModel):
    transfer_alerts: bool
    deposit_alerts: bool
    investment_alerts: bool
    card_alerts: bool
    security_alerts: bool

    class Config:
        from_attributes = True

class NotificationPreferenceUpdate(BaseModel):
    transfer_alerts: Optional[bool] = None
    deposit_alerts: Optional[bool] = None
    investment_alerts: Optional[bool] = None
    card_alerts: Optional[bool] = None
    security_alerts: Optional[bool] = None
