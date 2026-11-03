import httpx
import logging
from app.config import get_settings

logger = logging.getLogger(__name__)

async def send_tax_payment_receipt_email(
    email: str,
    full_name: str,
    amount: float,
    payment_type: str,
    irs_confirmation_number: str,
    source_account: str,
    symbol: str = "$"
) -> bool:
    """Delivers electronic IRS tax payment receipt via Resend."""
    settings = get_settings()
    if not settings.RESEND_API_KEY:
        logger.warning(f"Resend is not configured. Skipping tax payment email for {email}.")
        return False

    type_label = {
        "1040_estimated": "Form 1040 Quarterly Estimated Tax",
        "balance_due": "Annual Tax Return Balance Due",
        "extension": "Form 4868 Extension Payment"
    }.get(payment_type, "Federal Tax Payment")

    subject = f"IRS Federal Tax Payment Receipt ({irs_confirmation_number}) — Prescott National Bank"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>IRS Tax Payment Receipt</title>
      <style>
        body {{ background-color: #04060c; color: #e2e8f0; font-family: -apple-system, sans-serif; margin: 0; padding: 40px 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #0c0f19; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 48px; }}
        .logo {{ font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 1px; margin-bottom: 32px; text-align: center; }}
        .logo span {{ color: #1faa6e; }}
        h1 {{ font-size: 22px; font-weight: 600; margin-bottom: 16px; color: #ffffff; text-align: center; }}
        p {{ font-size: 14px; color: #94a3b8; line-height: 1.6; }}
        .receipt-card {{ background-color: rgba(31, 170, 110, 0.04); border: 1px solid rgba(31, 170, 110, 0.2); border-radius: 16px; padding: 24px; margin: 24px 0; }}
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
        <h1>IRS Federal Tax Payment Processed</h1>
        <p>Dear {full_name},</p>
        <p>Your electronic federal tax payment has been successfully processed and submitted to the Internal Revenue Service (IRS).</p>
        
        <div class="receipt-card">
          <div class="receipt-row"><span class="receipt-label">IRS Confirmation Number</span><span class="receipt-value" style="color: #1faa6e;">{irs_confirmation_number}</span></div>
          <div class="receipt-row"><span class="receipt-label">Payment Category</span><span class="receipt-value">{type_label}</span></div>
          <div class="receipt-row"><span class="receipt-label">Payment Amount</span><span class="receipt-value">{symbol}{amount:,.2f}</span></div>
          <div class="receipt-row"><span class="receipt-label">Source Account</span><span class="receipt-value">{source_account.upper()}</span></div>
          <div class="receipt-row"><span class="receipt-label">Status</span><span class="receipt-value" style="color: #1faa6e;">ELECTRONICALLY CONFIRMED</span></div>
        </div>
        
        <p>Please retain this receipt and your IRS Confirmation Number for your federal tax records.</p>
        <div class="footer">© 2026 Prescott National Bank. Authorized Treasury Tax Payment Agent.<br>Member FDIC. Equal Housing Lender.</div>
      </div>
    </body>
    </html>
    """

    headers = {"Authorization": f"Bearer {settings.RESEND_API_KEY}", "Content-Type": "application/json"}
    payload = {"from": settings.RESEND_FROM_EMAIL, "to": [email], "subject": subject, "html": html_content}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post("https://api.resend.com/emails", json=payload, headers=headers)
            return resp.status_code < 400
    except Exception as e:
        logger.error(f"Failed to deliver tax payment receipt email: {str(e)}")
        return False
