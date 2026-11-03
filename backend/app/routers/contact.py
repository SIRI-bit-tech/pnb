import secrets
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.config import get_settings
from app.services.contact_email_service import send_contact_inquiry_emails

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contact", tags=["Contact & Public Inquiries"])

class ContactInquiryRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120, description="Customer or prospect full name")
    email: EmailStr = Field(..., description="Customer contact email address")
    category: str = Field("General Inquiry", max_length=100, description="Department / Category")
    subject: Optional[str] = Field(None, max_length=200, description="Subject line")
    message: str = Field(..., min_length=10, max_length=5000, description="Message body")

class ContactInquiryResponse(BaseModel):
    success: bool
    reference_id: str
    message: str
    assigned_email: str
    staff_notified: bool
    confirmation_sent: bool

@router.post(
    "",
    response_model=ContactInquiryResponse,
    summary="Submit public contact inquiry"
)
@router.post(
    "/submit",
    response_model=ContactInquiryResponse,
    summary="Submit public contact inquiry (alias)"
)
async def submit_contact_inquiry(payload: ContactInquiryRequest):
    """
    Public contact inquiry endpoint.
    Accepts inquiry details, assigns a tracked reference ticket,
    dispatches an intake alert to the assigned support email,
    and returns a customer confirmation receipt.
    """
    settings = get_settings()

    # Generate unique 6-character hex reference ID
    random_suffix = secrets.token_hex(3).upper()
    reference_id = f"PNB-CNT-{random_suffix}"

    logger.info(
        f"Processing contact form submission from '{payload.name}' <{payload.email}> "
        f"[Category: {payload.category}] [Ref: {reference_id}]"
    )

    # Dispatch live emails via Resend
    delivery_results = await send_contact_inquiry_emails(
        name=payload.name.strip(),
        email=str(payload.email).strip().lower(),
        category=payload.category.strip(),
        subject=payload.subject.strip() if payload.subject else None,
        message=payload.message.strip(),
        reference_id=reference_id
    )

    assigned_email = delivery_results.get("assigned_email") or settings.SUPPORT_EMAIL or "support@prescottnational.com"

    return ContactInquiryResponse(
        success=True,
        reference_id=reference_id,
        message="Your message has been successfully received by our Client Advisory team.",
        assigned_email=assigned_email,
        staff_notified=delivery_results.get("staff_notified", False),
        confirmation_sent=delivery_results.get("confirmation_sent", False)
    )

@router.get(
    "/info",
    summary="Get Prescott National Bank official contact coordinates"
)
async def get_contact_info():
    """Returns official branch and clearing coordinates for Prescott National Bank."""
    settings = get_settings()
    assigned_support = settings.CONTACT_RECEIVER_EMAIL.strip() or settings.SUPPORT_EMAIL.strip() or "support@prescottnational.com"

    return {
        "institution": "Prescott National Bank, N.A.",
        "primary_support_email": assigned_support,
        "emergency_fraud_desk": "24/7 Priority Electronic Support",
        "address": {
            "street": "California Street, Financial District",
            "city": "San Francisco",
            "state": "CA",
            "country": "United States"
        },
        "operating_hours": "Monday – Friday: 7:00 AM – 7:00 PM PST",
        "regulatory": {
            "fdic_insured": True,
            "equal_housing_lender": True
        }
    }
