import enum
from sqlalchemy import Column, String, Text, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base, IDMixin, TimestampMixin

class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class SupportTicket(Base, IDMixin, TimestampMixin):
    __tablename__ = "support_tickets"

    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=True)
    subject = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN, nullable=False)
    admin_response = Column(Text, nullable=True)
    assigned_agent = Column(String(100), nullable=True)

    # Relationships
    user = relationship("User", back_populates="support_tickets")
    messages = relationship("SupportMessage", back_populates="ticket", cascade="all, delete-orphan", order_by="SupportMessage.created_at")

class SupportMessage(Base, IDMixin, TimestampMixin):
    __tablename__ = "support_messages"

    ticket_id = Column(ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_type = Column(String(20), nullable=False)  # 'user', 'admin', 'system'
    sender_name = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)

    # Relationships
    ticket = relationship("SupportTicket", back_populates="messages")
