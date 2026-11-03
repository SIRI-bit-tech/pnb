import enum
from sqlalchemy import Column, String, Boolean, Numeric, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import Base, IDMixin, TimestampMixin

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class CountryType(str, enum.Enum):
    US = "US"
    CA = "CA"
    UK = "UK"

class CurrencyType(str, enum.Enum):
    USD = "USD"
    CAD = "CAD"
    GBP = "GBP"

class User(Base, IDMixin, TimestampMixin):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    salt = Column(String(64), nullable=False)
    
    country = Column(Enum(CountryType), nullable=False)
    state = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    zip_code = Column(String(20), nullable=False)
    
    profile_image_url = Column(String(512), nullable=True)
    phone_number = Column(String(50), nullable=True)
    dob = Column(String(50), nullable=True)
    sex = Column(String(20), nullable=True)
    transaction_pin_hash = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_approved = Column(Boolean, default=False, server_default="false", nullable=False)
    otp_code = Column(String(10), nullable=True)
    otp_expires_at = Column(Numeric, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    currency = Column(Enum(CurrencyType), nullable=False)
    locale = Column(String(10), default="en_US", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    ban_reason = Column(String(500), nullable=True)
    two_factor_enabled = Column(Boolean, default=False, server_default="false", nullable=False)
    two_factor_secret = Column(String(128), nullable=True)

    # Relationships
    account = relationship("Account", back_populates="user", uselist=False, cascade="all, delete-orphan")
    deposits = relationship("Deposit", back_populates="user", foreign_keys="[Deposit.user_id]", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    notification_preferences = relationship("NotificationPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    support_tickets = relationship("SupportTicket", back_populates="user", cascade="all, delete-orphan")
    virtual_cards = relationship("VirtualCard", back_populates="user", cascade="all, delete-orphan")
    holdings = relationship("Holding", back_populates="user", cascade="all, delete-orphan")
    loans = relationship("Loan", back_populates="user", cascade="all, delete-orphan")
    tax_payments = relationship("TaxPayment", back_populates="user", cascade="all, delete-orphan")
    tax_documents = relationship("TaxDocument", back_populates="user", cascade="all, delete-orphan")
    w9_certification = relationship("W9Certification", back_populates="user", uselist=False, cascade="all, delete-orphan")
    irs_refunds = relationship("IrsRefund", back_populates="user", cascade="all, delete-orphan")

class Account(Base, IDMixin, TimestampMixin):
    __tablename__ = "accounts"

    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    balance = Column(Numeric(19, 4), default=0.0000, nullable=False)
    checking_balance = Column(Numeric(19, 4), server_default="0.0000", default=0.0000, nullable=False)
    checking_account_number = Column(String(50), unique=True, nullable=True)
    savings_balance = Column(Numeric(19, 4), server_default="0.0000", default=0.0000, nullable=False)
    savings_account_number = Column(String(50), unique=True, nullable=True)
    credit_balance = Column(Numeric(19, 4), server_default="0.0000", default=0.0000, nullable=False)
    credit_account_number = Column(String(50), unique=True, nullable=True)
    currency = Column(Enum(CurrencyType), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_frozen = Column(Boolean, default=False, nullable=False)
    freeze_reason = Column(String(1000), nullable=True)
    account_number = Column(String(50), unique=True, nullable=True)
    routing_number = Column(String(50), nullable=True)
    investment_balance = Column(Numeric(19, 4), server_default="0.0000", default=0.0000, nullable=False)
    margin_enabled = Column(Boolean, server_default="false", default=False, nullable=False)
    short_enabled = Column(Boolean, server_default="false", default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="account")
