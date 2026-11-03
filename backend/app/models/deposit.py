import enum
from sqlalchemy import Column, String, Numeric, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Base, IDMixin, TimestampMixin

class DepositType(str, enum.Enum):
    CHECK = "check"
    CASHAPP = "cashapp"
    PAYPAL = "paypal"

class DepositStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"

class Deposit(Base, IDMixin, TimestampMixin):
    __tablename__ = "deposits"

    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum(DepositType), nullable=False)
    amount = Column(Numeric(19, 4), nullable=False)
    status = Column(Enum(DepositStatus), default=DepositStatus.PENDING, nullable=False)
    admin_notes = Column(String(500), nullable=True)
    
    # Check deposit specific fields (stored as UploadThing URLs)
    image_front_url = Column(String(512), nullable=True)
    image_back_url = Column(String(512), nullable=True)
    
    # External deposits specific fields
    reference_id = Column(String(255), nullable=True)
    
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="deposits")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
