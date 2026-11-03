import httpx
import logging
from app.config import get_settings

logger = logging.getLogger(__name__)

async def send_portfolio_email(email: str, subject: str, html_content: str) -> bool:
    """Helper to send a transactional email via Resend API."""
    settings = get_settings()
    if not settings.RESEND_API_KEY:
        logger.warning(f"Resend not configured. Skipping email to {email}: {subject}")
        return False

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
                logger.error(f"Resend portfolio email failed: {resp.status_code} - {resp.text}")
                return False
            return True
    except Exception as e:
        logger.error(f"Failed to deliver portfolio email via Resend: {str(e)}")
        return False

async def send_trade_confirmation_email(
    email: str, full_name: str, ticker: str, action: str, shares: int, price: float, total_cost: float, symbol: str
):
    subject = f"Trade Execution Confirmed: {action.upper()} {ticker} — Prescott National Bank"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Trade Confirmation</title>
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
        .receipt-value {{ color: #ffffff; font-weight: bold; font-mono; }}
        .footer {{ font-size: 11px; color: #64748b; margin-top: 40px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 24px; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">PRESCOTT <span>NATIONAL</span></div>
        <h1>Order Executed Successfully</h1>
        <p>Dear {full_name},</p>
        <p>Your market order has been filled and confirmed on our investment ledger.</p>
        
        <div class="receipt-card">
          <div class="receipt-row"><span class="receipt-label">Ticker Symbol</span><span class="receipt-value">{ticker}</span></div>
          <div class="receipt-row"><span class="receipt-label">Action</span><span class="receipt-value" style="color: #1faa6e;">{action.upper()}</span></div>
          <div class="receipt-row"><span class="receipt-label">Quantity</span><span class="receipt-value">{shares} shares</span></div>
          <div class="receipt-row"><span class="receipt-label">Price per Share</span><span class="receipt-value">{symbol}{price:.2f}</span></div>
          <div class="receipt-row"><span class="receipt-label">Total Execution Value</span><span class="receipt-value">{symbol}{total_cost:.2f}</span></div>
        </div>
        
        <div class="footer">© 2026 Prescott National Bank. All rights reserved.<br>Member FDIC. Equal Housing Lender.</div>
      </div>
    </body>
    </html>
    """
    await send_portfolio_email(email, subject, html_content)

async def send_realized_gain_loss_email(
    email: str, full_name: str, ticker: str, shares: int, open_price: float, close_price: float, gain_loss: float, symbol: str
):
    is_gain = gain_loss >= 0
    subject = f"Position Closed: {ticker} Realized {'Gain' if is_gain else 'Loss'} — Prescott National Bank"
    color = "#1faa6e" if is_gain else "#ef4444"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Realized Performance Summary</title>
      <style>
        body {{ background-color: #04060c; color: #e2e8f0; font-family: -apple-system, sans-serif; margin: 0; padding: 40px 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #0c0f19; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 48px; }}
        .logo {{ font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 1px; margin-bottom: 32px; text-align: center; }}
        .logo span {{ color: {color}; }}
        h1 {{ font-size: 22px; font-weight: 600; margin-bottom: 16px; color: #ffffff; text-align: center; }}
        p {{ font-size: 14px; color: #94a3b8; line-height: 1.6; }}
        .receipt-card {{ background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 24px; margin: 24px 0; }}
        .receipt-row {{ display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; }}
        .receipt-row:last-child {{ margin-bottom: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 12px; margin-top: 12px; }}
        .receipt-label {{ color: #94a3b8; }}
        .receipt-value {{ color: #ffffff; font-weight: bold; font-mono; }}
        .footer {{ font-size: 11px; color: #64748b; margin-top: 40px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 24px; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">PRESCOTT <span>NATIONAL</span></div>
        <h1>Position Closed Summary</h1>
        <p>Dear {full_name},</p>
        <p>You have fully or partially closed your position in {ticker}. Here is your realized transaction outcome:</p>
        
        <div class="receipt-card">
          <div class="receipt-row"><span class="receipt-label">Ticker Symbol</span><span class="receipt-value">{ticker}</span></div>
          <div class="receipt-row"><span class="receipt-label">Shares Closed</span><span class="receipt-value">{shares} shares</span></div>
          <div class="receipt-row"><span class="receipt-label">Opening Cost/Price</span><span class="receipt-value">{symbol}{open_price:.2f}</span></div>
          <div class="receipt-row"><span class="receipt-label">Closing Price</span><span class="receipt-value">{symbol}{close_price:.2f}</span></div>
          <div class="receipt-row"><span class="receipt-label">Realized Result</span><span class="receipt-value" style="color: {color};">
            {'+' if is_gain else ''}{symbol}{gain_loss:.2f} ({'+' if is_gain else ''}{(gain_loss / (shares * open_price) * 100):.2f}%)
          </span></div>
        </div>
        
        <div class="footer">© 2026 Prescott National Bank. All rights reserved.<br>Member FDIC. Equal Housing Lender.</div>
      </div>
    </body>
    </html>
    """
    await send_portfolio_email(email, subject, html_content)

async def send_portfolio_transfer_email(
    email: str, full_name: str, amount: float, tx_type: str, source_account: str, symbol: str
):
    subject = f"Portfolio Cash {tx_type.capitalize()} Processed — Prescott National Bank"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Portfolio Transfer Receipt</title>
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
        .receipt-value {{ color: #ffffff; font-weight: bold; font-mono; }}
        .footer {{ font-size: 11px; color: #64748b; margin-top: 40px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 24px; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">PRESCOTT <span>NATIONAL</span></div>
        <h1>Transfer Confirmed</h1>
        <p>Dear {full_name},</p>
        <p>We have successfully processed your internal portfolio ledger transfer request.</p>
        
        <div class="receipt-card">
          <div class="receipt-row"><span class="receipt-label">Ledger Action</span><span class="receipt-value">{tx_type.upper()}</span></div>
          <div class="receipt-row"><span class="receipt-label">Linked Account</span><span class="receipt-value">{source_account.capitalize()}</span></div>
          <div class="receipt-row"><span class="receipt-label">Amount</span><span class="receipt-value">{symbol}{amount:.2f}</span></div>
          <div class="receipt-row"><span class="receipt-label">Status</span><span class="receipt-value" style="color: #1faa6e;">COMPLETED</span></div>
        </div>
        
        <div class="footer">© 2026 Prescott National Bank. All rights reserved.<br>Member FDIC. Equal Housing Lender.</div>
      </div>
    </body>
    </html>
    """
    await send_portfolio_email(email, subject, html_content)
