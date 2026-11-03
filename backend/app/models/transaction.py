import enum
from sqlalchemy import Column, String, Numeric, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import Base, IDMixin, TimestampMixin
from app.models.user import CurrencyType

class TransactionType(str, enum.Enum):
    P2P = "p2p"
    WIRE = "wire"
    ACH = "ach"
    DEPOSIT = "deposit"

class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Transaction(Base, IDMixin, TimestampMixin):
    __tablename__ = "transactions"

    from_account_id = Column(ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    to_account_id = Column(ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    type = Column(Enum(TransactionType), nullable=False)
    amount = Column(Numeric(19, 4), nullable=False)
    currency = Column(Enum(CurrencyType), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False)
    routing_number = Column(String(50), nullable=True)
    external_bank_name = Column(String(100), nullable=True)
    external_account_number = Column(String(50), nullable=True)
    external_account_name = Column(String(100), nullable=True)
    fee = Column(Numeric(19, 4), default=0.0000, nullable=False)
    memo = Column(String(255), nullable=True)

    # Relationships
    from_account = relationship("Account", foreign_keys=[from_account_id])
    to_account = relationship("Account", foreign_keys=[to_account_id])
