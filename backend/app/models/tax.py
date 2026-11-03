import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, IDMixin, TimestampMixin

class TaxPayment(Base, IDMixin, TimestampMixin):
    __tablename__ = "tax_payments"

    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tax_year = Column(String(10), nullable=False, default="2026")
    payment_type = Column(String(50), nullable=False)  # 1040_estimated, balance_due, extension
    amount = Column(Float, nullable=False)
    source_account = Column(String(20), nullable=False, default="checking")
    status = Column(String(20), nullable=False, default="completed")
    irs_confirmation_number = Column(String(50), nullable=False, unique=True)

    user = relationship("User", back_populates="tax_payments")

class TaxDocument(Base, IDMixin, TimestampMixin):
    __tablename__ = "tax_documents"

    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tax_year = Column(String(10), nullable=False, default="2025")
    document_type = Column(String(20), nullable=False)  # 1099-INT, 1099-DIV, 1099-B, 1098
    description = Column(String(255), nullable=False)
    total_amount = Column(Float, nullable=False, default=0.0)
    pdf_url = Column(String(512), nullable=True)

    user = relationship("User", back_populates="tax_documents")

class W9Certification(Base, IDMixin, TimestampMixin):
    __tablename__ = "w9_certifications"

    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    ssn_last4 = Column(String(4), nullable=False)
    tax_classification = Column(String(100), nullable=False, default="Individual/Sole proprietor")
    signature_name = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False, default="verified")

    user = relationship("User", back_populates="w9_certification")

class IrsRefund(Base, IDMixin, TimestampMixin):
    __tablename__ = "irs_refunds"

    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    refund_amount = Column(Float, nullable=False)
    tax_year = Column(String(10), nullable=False, default="2025")
    status = Column(String(20), nullable=False, default="received")  # received, approved, deposited
    estimated_deposit_date = Column(String(50), nullable=False, default="Aug 12, 2026")
    deposited_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="irs_refunds")
