import httpx
import logging
from app.config import get_settings

logger = logging.getLogger(__name__)

async def send_loan_approval_email(
    email: str,
    full_name: str,
    amount: float,
    destination_account: str,
    symbol: str = "$"
) -> bool:
    """Delivers transactional email receipt when a loan is approved and credited."""
    settings = get_settings()
    if not settings.RESEND_API_KEY:
        logger.warning(f"Resend is not configured. Skipping loan approval email for {email}.")
        return False

    subject = f"Personal Loan Approved — Prescott National Bank"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Loan Approved</title>
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
        <h1>Personal Loan Approved & Funded</h1>
        <p>Dear {full_name},</p>
        <p>Congratulations! Your personal loan application has passed compliance verification, was approved, and the funds have been added directly to your account balance.</p>
        
        <div class="receipt-card">
          <div class="receipt-row"><span class="receipt-label">Loan Amount</span><span class="receipt-value">{symbol}{amount:,.2f}</span></div>
          <div class="receipt-row"><span class="receipt-label">Target Account</span><span class="receipt-value">{destination_account.upper()}</span></div>
          <div class="receipt-row"><span class="receipt-label">Status</span><span class="receipt-value" style="color: #1faa6e;">APPROVED & FUNDED</span></div>
        </div>
        
        <div class="footer">© 2026 Prescott National Bank. All rights reserved.<br>Member FDIC. Equal Housing Lender.</div>
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
        logger.error(f"Failed to deliver loan approval email: {str(e)}")
        return False

async def send_loan_rejection_email(
    email: str,
    full_name: str,
    amount: float,
    rejection_reason: str,
    symbol: str = "$"
) -> bool:
    """Delivers formal compliance rejection email with admin reason."""
    settings = get_settings()
    if not settings.RESEND_API_KEY:
        logger.warning(f"Resend is not configured. Skipping loan rejection email for {email}.")
        return False

    subject = f"Loan Application Status Notice — Prescott National Bank"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Loan Notice</title>
      <style>
        body {{ background-color: #04060c; color: #e2e8f0; font-family: -apple-system, sans-serif; margin: 0; padding: 40px 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #0c0f19; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 48px; }}
        .logo {{ font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 1px; margin-bottom: 32px; text-align: center; }}
        .logo span {{ color: #ef4444; }}
        h1 {{ font-size: 22px; font-weight: 600; margin-bottom: 16px; color: #ffffff; text-align: center; }}
        p {{ font-size: 14px; color: #94a3b8; line-height: 1.6; }}
        .receipt-card {{ background-color: rgba(239, 68, 68, 0.04); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 16px; padding: 24px; margin: 24px 0; }}
        .receipt-row {{ display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; }}
        .receipt-label {{ color: #94a3b8; }}
        .receipt-value {{ color: #ffffff; font-weight: bold; }}
        .reason-box {{ margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.08); color: #f87171; font-size: 13px; }}
        .footer {{ font-size: 11px; color: #64748b; margin-top: 40px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 24px; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">PRESCOTT <span>NATIONAL</span></div>
        <h1>Personal Loan Update</h1>
        <p>Dear {full_name},</p>
        <p>Thank you for submitting a personal loan application with Prescott National Bank. Following a review by our credit compliance system, your application for {symbol}{amount:,.2f} could not be approved at this time.</p>
        
        <div class="receipt-card">
          <div class="receipt-row"><span class="receipt-label">Loan Amount Requested</span><span class="receipt-value">{symbol}{amount:,.2f}</span></div>
          <div class="receipt-row"><span class="receipt-label">Status</span><span class="receipt-value" style="color: #ef4444;">DECLINED</span></div>
          <div class="reason-box"><strong>System Decision Reason:</strong><br>{rejection_reason}</div>
        </div>
        
        <p>If you have any questions or would like to re-apply with modified parameters, please contact customer support.</p>
        <div class="footer">© 2026 Prescott National Bank. All rights reserved.<br>Member FDIC. Equal Housing Lender.</div>
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
        logger.error(f"Failed to deliver loan rejection email: {str(e)}")
        return False
