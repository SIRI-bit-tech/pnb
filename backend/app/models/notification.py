import enum
from sqlalchemy import Column, String, Text, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import Base, IDMixin, TimestampMixin

class NotificationType(str, enum.Enum):
    TRANSFER = "transfer"
    DEPOSIT = "deposit"
    CARD = "card"
    INVESTMENT = "investment"
    SECURITY = "security"

class Notification(Base, IDMixin, TimestampMixin):
    __tablename__ = "notifications"

    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")

class NotificationPreference(Base, IDMixin, TimestampMixin):
    __tablename__ = "notification_preferences"

    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    transfer_alerts = Column(Boolean, default=True, nullable=False)
    deposit_alerts = Column(Boolean, default=True, nullable=False)
    investment_alerts = Column(Boolean, default=True, nullable=False)
    card_alerts = Column(Boolean, default=True, nullable=False)
    security_alerts = Column(Boolean, default=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="notification_preferences")
