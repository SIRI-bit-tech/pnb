from app.models.base import Base
from app.models.user import User, Account, UserRole, CountryType, CurrencyType
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.models.deposit import Deposit, DepositType, DepositStatus
from app.models.notification import Notification, NotificationPreference, NotificationType
from app.models.admin_config import AdminConfig
from app.models.support import SupportTicket, TicketStatus, SupportMessage
from app.models.card import VirtualCard, CardStatus
from app.models.holding import Holding
from app.models.loan import Loan, LoanStatus, LoanPayment
from app.models.tax import TaxPayment, TaxDocument, W9Certification, IrsRefund

# List all models for autogenerate detection by Alembic
__all__ = [
    "Base",
    "User",
    "Account",
    "UserRole",
    "CountryType",
    "CurrencyType",
    "Transaction",
    "TransactionType",
    "TransactionStatus",
    "Deposit",
    "DepositType",
    "DepositStatus",
    "Notification",
    "NotificationPreference",
    "NotificationType",
    "AdminConfig",
    "SupportTicket",
    "TicketStatus",
    "SupportMessage",
    "VirtualCard",
    "CardStatus",
    "Holding",
    "Loan",
    "LoanStatus",
    "LoanPayment",
    "TaxPayment",
    "TaxDocument",
    "W9Certification",
    "IrsRefund",
]
