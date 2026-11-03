import httpx
import logging
from typing import Optional, Dict, Any
from app.config import get_settings

logger = logging.getLogger(__name__)

async def send_contact_inquiry_emails(
    name: str,
    email: str,
    category: str,
    subject: Optional[str],
    message: str,
    reference_id: str,
    phone: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sends two emails upon public contact form submission:
    1. An alert notification to the bank's assigned support/admin mailbox with Reply-To set to the sender.
    2. An official Prescott National Bank receipt confirmation to the customer's email.
    """
    settings = get_settings()
    results = {
        "staff_notified": False,
        "confirmation_sent": False,
        "assigned_email": settings.CONTACT_RECEIVER_EMAIL.strip() or settings.SUPPORT_EMAIL.strip() or "support@prescottnational.com",
        "errors": []
    }

    if not settings.RESEND_API_KEY:
        logger.warning(f"Resend is not configured (RESEND_API_KEY missing). Skipping live contact emails for {email}.")
        results["errors"].append("Resend API key is not configured.")
        return results

    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type": "application/json"
    }

    clean_subject = (subject or category).strip()
    assigned_email = results["assigned_email"]

    # ─────────────────────────────────────────────────────────────
    # 1. Staff Intake Email (To Assigned Support / Inbox)
    # ─────────────────────────────────────────────────────────────
    staff_subject = f"[Inquiry #{reference_id}] {category}: {clean_subject} — {name}"

    # Escape message for HTML display
    formatted_message = message.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br>")

    staff_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Client Inquiry</title>
      <style>
        body {{ background-color: #0b111e; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 32px 16px; }}
        .container {{ max-width: 640px; margin: 0 auto; background-color: #121929; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 40px; }}
        .header {{ display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 20px; margin-bottom: 24px; }}
        .brand {{ font-size: 18px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px; }}
        .brand span {{ color: #1faa6e; }}
        .badge {{ background-color: rgba(31, 170, 110, 0.15); color: #1faa6e; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }}
        h1 {{ font-size: 20px; font-weight: 600; color: #ffffff; margin: 0 0 8px 0; }}
        .subtitle {{ font-size: 13px; color: #94a3b8; margin-bottom: 24px; }}
        .meta-card {{ background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 18px; margin-bottom: 24px; }}
        .meta-row {{ display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.04); }}
        .meta-row:last-child {{ border-bottom: none; }}
        .meta-label {{ color: #94a3b8; }}
        .meta-val {{ color: #f8fafc; font-weight: 500; text-align: right; }}
        .msg-card {{ background-color: #070d18; border: 1px solid rgba(31, 170, 110, 0.2); border-left: 4px solid #1faa6e; border-radius: 8px; padding: 20px; font-size: 14px; line-height: 1.6; color: #f1f5f9; }}
        .footer {{ margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 11px; color: #64748b; text-align: center; }}
        .action-hint {{ background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 8px; padding: 12px; margin-top: 20px; font-size: 12px; color: #38bdf8; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">PRESCOTT <span>NATIONAL</span> BANK</div>
          <div class="badge">Inbound Inquiry</div>
        </div>

        <h1>New Client Portal Message</h1>
        <p class="subtitle">A customer has submitted an inquiry through the Prescott National Bank public contact form.</p>

        <div class="meta-card">
          <div class="meta-row">
            <span class="meta-label">Reference ID</span>
            <span class="meta-val" style="font-family: monospace; color: #1faa6e;">{reference_id}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Sender Name</span>
            <span class="meta-val">{name}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Email Address</span>
            <span class="meta-val"><a href="mailto:{email}" style="color: #38bdf8; text-decoration: none;">{email}</a></span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Department / Category</span>
            <span class="meta-val">{category}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Subject</span>
            <span class="meta-val">{clean_subject}</span>
          </div>
        </div>

        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 8px;">Message Content:</div>
        <div class="msg-card">
          {formatted_message}
        </div>

        <div class="action-hint">
          ℹ️ You can reply directly to this email to respond to <strong>{name}</strong> at <strong>{email}</strong>.
        </div>

        <div class="footer">
          Prescott National Bank, N.A. • Automated Client Intake Gateway<br>
          California Street, Financial District, San Francisco, CA
        </div>
      </div>
    </body>
    </html>
    """

    staff_payload = {
        "from": settings.RESEND_FROM_EMAIL,
        "to": [assigned_email],
        "reply_to": email,
        "subject": staff_subject,
        "html": staff_html
    }

    # ─────────────────────────────────────────────────────────────
    # 2. Customer Receipt Confirmation Email
    # ─────────────────────────────────────────────────────────────
    customer_subject = f"We have received your message [Ref #{reference_id}] — Prescott National Bank"
    customer_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Inquiry Confirmation</title>
      <style>
        body {{ background-color: #0b111e; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 32px 16px; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #121929; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 40px; }}
        .logo {{ font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px; text-align: center; margin-bottom: 24px; }}
        .logo span {{ color: #1faa6e; }}
        h1 {{ font-size: 22px; font-weight: 600; color: #ffffff; text-align: center; margin: 0 0 12px 0; }}
        p {{ font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 16px 0; }}
        .card {{ background-color: rgba(31, 170, 110, 0.04); border: 1px solid rgba(31, 170, 110, 0.2); border-radius: 12px; padding: 20px; margin: 24px 0; }}
        .row {{ display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 10px; }}
        .row:last-child {{ margin-bottom: 0; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 10px; }}
        .label {{ color: #94a3b8; }}
        .val {{ color: #ffffff; font-weight: 500; text-align: right; }}
        .footer {{ font-size: 11px; color: #64748b; margin-top: 32px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">PRESCOTT <span>NATIONAL</span> BANK</div>
        <h1>Thank you for contacting us</h1>
        <p>Dear {name},</p>
        <p>We have received your inquiry and routed it to our <strong>{category}</strong> desk. A dedicated representative is reviewing your details and will get back to you shortly.</p>
        
        <div class="card">
          <div class="row">
            <span class="label">Reference Ticket</span>
            <span class="val" style="font-family: monospace; color: #1faa6e;">{reference_id}</span>
          </div>
          <div class="row">
            <span class="label">Department</span>
            <span class="val">{category}</span>
          </div>
          <div class="row">
            <span class="label">Expected Response</span>
            <span class="val" style="color: #38bdf8;">Within 4 business hours</span>
          </div>
        </div>

        <p style="font-size: 13px;">If you have additional documentation or account numbers relevant to this inquiry, please reply directly to this email with your reference ID in the subject.</p>

        <div class="footer">
          Prescott National Bank, N.A. • Member FDIC • Equal Housing Lender<br>
          California Street, Financial District, San Francisco, CA<br>
          Priority Electronic Client Services
        </div>
      </div>
    </body>
    </html>
    """

    customer_payload = {
        "from": settings.RESEND_FROM_EMAIL,
        "to": [email],
        "subject": customer_subject,
        "html": customer_html
    }

    # Dispatch via Resend HTTP client
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # 1. Send staff alert
            resp_staff = await client.post("https://api.resend.com/emails", json=staff_payload, headers=headers)
            if resp_staff.status_code < 400:
                results["staff_notified"] = True
                logger.info(f"Delivered contact inquiry #{reference_id} to assigned inbox: {assigned_email}")
            else:
                err_msg = f"Failed to notify staff inbox ({resp_staff.status_code}): {resp_staff.text}"
                logger.error(err_msg)
                results["errors"].append(err_msg)

            # 2. Send customer confirmation receipt
            resp_customer = await client.post("https://api.resend.com/emails", json=customer_payload, headers=headers)
            if resp_customer.status_code < 400:
                results["confirmation_sent"] = True
                logger.info(f"Delivered contact confirmation #{reference_id} to customer: {email}")
            else:
                err_msg = f"Failed to deliver customer receipt ({resp_customer.status_code}): {resp_customer.text}"
                logger.warning(err_msg)
                results["errors"].append(err_msg)

    except Exception as e:
        err_msg = f"Resend exception during contact inquiry #{reference_id}: {str(e)}"
        logger.error(err_msg)
        results["errors"].append(err_msg)

    return results
