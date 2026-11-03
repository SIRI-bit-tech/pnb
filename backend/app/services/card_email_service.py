import httpx
import logging
from app.config import get_settings

logger = logging.getLogger(__name__)

async def send_card_approval_email(
    email: str,
    full_name: str,
    last4: str,
    balance: float,
    symbol: str = "$"
) -> bool:
    """Delivers transactional email receipt when a virtual card is approved and activated."""
    settings = get_settings()
    if not settings.RESEND_API_KEY:
        logger.warning(f"Resend is not configured. Skipping card activation email for {email}.")
        return False

    subject = f"Virtual Card Approved & Activated — Prescott National Bank"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Virtual Card Issued</title>
      <style>
        body {{ background-color: #04060c; color: #e2e8f0; font-family: -apple-system, sans-serif; margin: 0; padding: 40px 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #0c0f19; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 48px; }}
        .logo {{ font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 1px; margin-bottom: 32px; text-align: center; }}
        .logo span {{ color: #1faa6e; }}
        h1 {{ font-size: 22px; font-weight: 600; margin-bottom: 16px; color: #ffffff; text-align: center; }}
        p {{ font-size: 14px; color: #94a3b8; line-height: 1.6; }}
        .receipt-card {{ background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 24px; margin: 24px 0; }}
        .receipt-row {{ display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; }}
        .receipt-row:last-child {{ margin-bottom: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 12px; margin-top: 12px; }}
        .receipt-label {{ color: #94a3b8; }}
        .receipt-value {{ color: #ffffff; font-weight: bold; font-family: monospace; }}
        .footer {{ font-size: 11px; color: #64748b; margin-top: 40px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 24px; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">PRESCOTT <span>NATIONAL</span></div>
        <h1>Virtual Card Ready for Use</h1>
        <p>Dear {full_name},</p>
        <p>Great news! Your requested Virtual Visa Card has passed security verification, completed activation, and is now live on your account dashboard.</p>
        
        <div class="receipt-card">
          <div class="receipt-row"><span class="receipt-label">Card Brand</span><span class="receipt-value">Visa Virtual Debit</span></div>
          <div class="receipt-row"><span class="receipt-label">Card Number</span><span class="receipt-value">•••• •••• •••• {last4}</span></div>
          <div class="receipt-row"><span class="receipt-label">Initial Balance</span><span class="receipt-value">{symbol}{balance:.2f}</span></div>
          <div class="receipt-row"><span class="receipt-label">Status</span><span class="receipt-value" style="color: #1faa6e;">ACTIVE</span></div>
        </div>
        
        <div class="footer">© 2026 Prescott National Bank. All rights reserved.<br>Member FDIC. Equal Housing Lender.</div>
      </div>
    </body>
    </html>
    """

    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "from": settings.RESEND_FROM_EMAIL,
        "to": [email],
        "subject": subject,
        "html": html_content
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post("https://api.resend.com/emails", json=payload, headers=headers)
            if resp.status_code >= 400:
                logger.error(f"Resend card email failed: {resp.status_code} - {resp.text}")
                return False
            return True
    except Exception as e:
        logger.error(f"Failed to deliver card approval email via Resend: {str(e)}")
        return False
