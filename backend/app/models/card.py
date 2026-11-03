import enum
from sqlalchemy import Column, String, ForeignKey, Boolean, Float, Integer, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Base, IDMixin, TimestampMixin

class CardStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    REJECTED = "rejected"

class VirtualCard(Base, IDMixin, TimestampMixin):
    __tablename__ = "virtual_cards"

    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    card_number_encrypted = Column(String(512), nullable=True)
    expiry = Column(String(10), nullable=True)
    cvv_encrypted = Column(String(256), nullable=True)
    status = Column(String(20), default="pending", nullable=False)
    is_frozen = Column(Boolean, server_default="false", default=False, nullable=False)
    funding_amount = Column(Float, default=0.0, nullable=False)
    balance = Column(Float, default=0.0, nullable=False)
    source_account = Column(String(20), default="checking", nullable=False)
    approved_at = Column(DateTime, nullable=True)
    activation_delay_hours = Column(Integer, default=1, nullable=False)

    # Relationships
    user = relationship("User", back_populates="virtual_cards")
