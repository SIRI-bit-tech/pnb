import uuid
import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.support import SupportTicket, SupportMessage, TicketStatus
from app.middleware.auth import get_current_user
from app.services.ably_service import ably_service
from app.schemas.support import (
    SupportTopic,
    SupportTicketCreate,
    SupportTicketListItem,
    SupportTicketDetailResponse,
    SupportMessageCreate,
    SupportMessageResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/support", tags=["Support & Live Chat"])

BANKING_TOPICS = [
    SupportTopic(
        id="transfers-wires",
        name="Transfers & Wires",
        icon="Send",
        description="Domestic and international wire transfers, ACH payments, and transfer status inquiries.",
        badge="Transfers",
        typical_response_time="~3 min"
    ),
    SupportTopic(
        id="cards-limits",
        name="Cards & Limits",
        icon="CreditCard",
        description="Debit cards, virtual cards, spending limits, card replacements, and transaction disputes.",
        badge="Cards",
        typical_response_time="~2 min"
    ),
    SupportTopic(
        id="deposits-settlement",
        name="Deposits",
        icon="ArrowDownToLine",
        description="Direct deposits, mobile check deposits, deposit holds, and incoming wire credits.",
        badge="Deposits",
        typical_response_time="~3 min"
    ),
    SupportTopic(
        id="security-access",
        name="Security & Access",
        icon="ShieldCheck",
        description="Login issues, two-factor authentication, account holds, and security concerns.",
        badge="Security",
        typical_response_time="~1 min"
    ),
    SupportTopic(
        id="loans-credit",
        name="Loans & Credit",
        icon="Landmark",
        description="Loan payments, payoff requests, interest statements, and credit facility questions.",
        badge="Lending",
        typical_response_time="~5 min"
    ),
    SupportTopic(
        id="general",
        name="General Help",
        icon="Headphones",
        description="Account statements, tax documents, fees, and general account inquiries.",
        badge="General",
        typical_response_time="~3 min"
    ),
]


@router.get("/topics", response_model=List[SupportTopic])
async def get_support_topics():
    """Return pre-configured banking departments and categories for priority support."""
    return BANKING_TOPICS


@router.post("/tickets", response_model=SupportTicketDetailResponse)
async def create_support_ticket(
    ticket_in: SupportTicketCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new support ticket and initialize real-time chat with an instant automated banking assistant greeting.
    """
    ticket = SupportTicket(
        user_id=current_user.id,
        category=ticket_in.category,
        subject=ticket_in.subject,
        message=ticket_in.message,
        status=TicketStatus.OPEN,
    )
    db.add(ticket)
    await db.flush()  # Generate ticket.id

    # 1. User's initial message
    user_msg = SupportMessage(
        ticket_id=ticket.id,
        sender_type="user",
        sender_name=current_user.full_name or "Client",
        content=ticket_in.message,
        is_read=True
    )
    db.add(user_msg)

    # 2. Automated greeting — connecting to a support agent
    first_name = (current_user.full_name.split()[0] if current_user.full_name else "Valued Client")
    short_ref = str(ticket.id)[:8].upper()
    bot_content = (
        f"Hi {first_name}, your request (#{short_ref}) has been received and routed to {ticket_in.category}.\n\n"
        f"A support representative will join this conversation shortly. "
        f"Average wait time is under 5 minutes during business hours.\n\n"
        f"If you have any account numbers, transaction IDs, or dates related to your inquiry, please share them here while you wait."
    )
    bot_msg = SupportMessage(
        ticket_id=ticket.id,
        sender_type="system",
        sender_name="Prescott National Bank Support",
        content=bot_content,
        is_read=True
    )
    db.add(bot_msg)

    await db.commit()
    await db.refresh(ticket)

    # Query with messages ordered
    stmt = (
        select(SupportTicket)
        .options(selectinload(SupportTicket.messages))
        .filter(SupportTicket.id == ticket.id)
    )
    res = await db.execute(stmt)
    full_ticket = res.scalars().first()

    # Publish real-time events via Ably
    try:
        # Publish user message
        await ably_service.publish_support_message(
            ticket_id=str(ticket.id),
            message_data={
                "id": str(user_msg.id),
                "ticket_id": str(ticket.id),
                "sender_type": "user",
                "sender_name": user_msg.sender_name,
                "content": user_msg.content,
                "created_at": user_msg.created_at.isoformat() if user_msg.created_at else datetime.utcnow().isoformat(),
            },
            user_id=str(current_user.id)
        )
        # Publish assistant greeting
        await ably_service.publish_support_message(
            ticket_id=str(ticket.id),
            message_data={
                "id": str(bot_msg.id),
                "ticket_id": str(ticket.id),
                "sender_type": "system",
                "sender_name": bot_msg.sender_name,
                "content": bot_msg.content,
                "created_at": bot_msg.created_at.isoformat() if bot_msg.created_at else datetime.utcnow().isoformat(),
            },
            user_id=str(current_user.id)
        )
    except Exception as e:
        logger.warning(f"Failed to publish support ticket creation events: {e}")

    return full_ticket


@router.get("/tickets", response_model=List[SupportTicketListItem])
async def list_user_tickets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all tickets for the authenticated user with latest message info."""
    stmt = (
        select(SupportTicket)
        .options(selectinload(SupportTicket.messages))
        .filter(SupportTicket.user_id == current_user.id)
        .order_by(desc(SupportTicket.updated_at))
    )
    res = await db.execute(stmt)
    tickets = res.scalars().all()

    items = []
    for t in tickets:
        last_msg = None
        last_sender = None
        unread = 0
        if t.messages:
            sorted_msgs = sorted(t.messages, key=lambda m: m.created_at)
            last_msg = sorted_msgs[-1].content
            last_sender = sorted_msgs[-1].sender_name
            unread = sum(1 for m in sorted_msgs if not m.is_read and m.sender_type != "user")
        else:
            last_msg = t.message
            last_sender = current_user.full_name

        items.append(
            SupportTicketListItem(
                id=t.id,
                user_id=t.user_id,
                category=t.category,
                subject=t.subject,
                status=t.status,
                created_at=t.created_at,
                updated_at=t.updated_at,
                last_message=last_msg,
                last_sender=last_sender,
                unread_count=unread
            )
        )
    return items


@router.get("/tickets/{ticket_id}", response_model=SupportTicketDetailResponse)
async def get_ticket_details(
    ticket_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get full ticket conversation history for the current user."""
    stmt = (
        select(SupportTicket)
        .options(selectinload(SupportTicket.messages))
        .filter(SupportTicket.id == ticket_id, SupportTicket.user_id == current_user.id)
    )
    res = await db.execute(stmt)
    ticket = res.scalars().first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")

    # Mark unread messages from admin/system as read
    changed = False
    for msg in ticket.messages:
        if not msg.is_read and msg.sender_type != "user":
            msg.is_read = True
            changed = True
    if changed:
        await db.commit()

    return ticket


@router.post("/tickets/{ticket_id}/messages", response_model=SupportMessageResponse)
async def send_ticket_message(
    ticket_id: uuid.UUID,
    msg_in: SupportMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a new message in the ticket thread in real time."""
    stmt = select(SupportTicket).filter(
        SupportTicket.id == ticket_id,
        SupportTicket.user_id == current_user.id
    )
    res = await db.execute(stmt)
    ticket = res.scalars().first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")

    # Block messaging on closed/resolved tickets — user must create a new request
    ticket_status = str(ticket.status).lower().replace("ticketstatus.", "")
    if ticket_status in ("resolved", "closed"):
        raise HTTPException(
            status_code=403,
            detail="This conversation has been closed. Please create a new support request if you need further assistance."
        )
    from datetime import timezone
    ticket.updated_at = datetime.now(timezone.utc)

    new_msg = SupportMessage(
        ticket_id=ticket.id,
        sender_type="user",
        sender_name=current_user.full_name or "Client",
        content=msg_in.content,
        is_read=True
    )
    db.add(new_msg)
    await db.commit()
    await db.refresh(new_msg)

    # Broadcast via Ably
    try:
        msg_payload = {
            "id": str(new_msg.id),
            "ticket_id": str(ticket.id),
            "sender_type": "user",
            "sender_name": new_msg.sender_name,
            "content": new_msg.content,
            "created_at": new_msg.created_at.isoformat() if new_msg.created_at else datetime.now(timezone.utc).isoformat(),
        }
        await ably_service.publish_support_message(
            ticket_id=str(ticket.id),
            message_data=msg_payload,
            user_id=str(current_user.id)
        )
    except Exception as e:
        logger.warning(f"Failed to publish user ticket message to Ably: {e}")

    return {
        "id": new_msg.id,
        "ticket_id": new_msg.ticket_id,
        "sender_type": new_msg.sender_type,
        "sender_name": new_msg.sender_name,
        "content": new_msg.content,
        "is_read": new_msg.is_read,
        "created_at": new_msg.created_at,
    }
