import enum
from sqlalchemy import Column, String, ForeignKey, Float, Integer, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base, IDMixin, TimestampMixin

class LoanStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID_OFF = "paid_off"

class Loan(Base, IDMixin, TimestampMixin):
    __tablename__ = "loans"

    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    term_months = Column(Integer, nullable=False)
    interest_rate = Column(Float, default=5.99, nullable=False)
    monthly_payment = Column(Float, nullable=False)
    total_repayment = Column(Float, nullable=False)
    remaining_balance = Column(Float, nullable=False)
    employment_status = Column(String(50), nullable=False)
    destination_account = Column(String(20), default="checking", nullable=False)
    status = Column(String(20), default="pending", nullable=False)
    autopay_enabled = Column(Boolean, default=True, nullable=False)
    rejection_reason = Column(String(512), nullable=True)
    approved_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="loans")
    payments = relationship("LoanPayment", back_populates="loan", cascade="all, delete-orphan")

class LoanPayment(Base, IDMixin, TimestampMixin):
    __tablename__ = "loan_payments"

    loan_id = Column(ForeignKey("loans.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    principal = Column(Float, nullable=False)
    interest = Column(Float, nullable=False)
    status = Column(String(20), default="cleared", nullable=False)
    payment_date = Column(DateTime, nullable=False)

    loan = relationship("Loan", back_populates="payments")
