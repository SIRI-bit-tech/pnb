import json
import base64
import time
import logging
from typing import Optional, Dict, Any
from cryptography.fernet import Fernet, InvalidToken
import stytch
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.config import get_settings
from app.models.user import User, Account, UserRole
from app.utils.security import generate_salt, hash_password, verify_password
from app.utils.validators import get_currency_for_country

logger = logging.getLogger(__name__)
settings = get_settings()

# Initialize Fernet symmetric encryption key for session tokens
# We derive a key from BETTER_AUTH_SECRET (needs to be 32 bytes)
_secret_bytes = settings.BETTER_AUTH_SECRET.encode("utf-8")
if len(_secret_bytes) < 32:
    # Pad to 32 bytes if too short
    _secret_bytes = _secret_bytes.ljust(32, b"0")[:32]
else:
    # Use first 32 bytes if longer
    _secret_bytes = _secret_bytes[:32]

fernet_key = base64.urlsafe_b64encode(_secret_bytes)
fernet = Fernet(fernet_key)

# Initialize Stytch client if keys are present
stytch_client = None
if settings.STYTCH_PROJECT_ID and settings.STYTCH_SECRET:
    try:
        stytch_client = stytch.Client(
            project_id=settings.STYTCH_PROJECT_ID,
            secret=settings.STYTCH_SECRET,
            environment="live"
        )
    except Exception as e:
        logger.error(f"Failed to initialize Stytch client: {str(e)}")

class AuthService:
    @staticmethod
    def generate_session_token(user_id: str, role: str) -> str:
        """
        Generates an encrypted session token containing user_id, role, and expiry timestamp (24h).
        """
        expiry = int(time.time()) + 86400  # 24 hours
        payload = {
            "user_id": user_id,
            "role": role,
            "exp": expiry
        }
        json_payload = json.dumps(payload)
        encrypted_token = fernet.encrypt(json_payload.encode("utf-8"))
        return encrypted_token.decode("utf-8")

    @staticmethod
    def verify_session_token(token: str) -> Optional[Dict[str, Any]]:
        """
        Decrypts and validates the session token. Returns payload dict if valid, else None.
        """
        try:
            decrypted_bytes = fernet.decrypt(token.encode("utf-8"))
            payload = json.loads(decrypted_bytes.decode("utf-8"))
            
            # Check expiration
            if time.time() > payload.get("exp", 0):
                logger.warning("Session token has expired")
                return None
                
            return payload
        except (InvalidToken, Exception) as e:
            logger.warning(f"Invalid session token verification failed: {str(e)}")
            return None

    @staticmethod
    async def send_otp(
        target: str,
        channel: str = "email",
        digits: int = 6,
        purpose: str = "registration"
    ) -> bool:
        """
        Triggers OTP dispatch:
        - For registration/login: generates a 6-digit code.
        - For transfer authorization: generates a 4-digit code.
        - Dispatches via Resend email.
        """
        import secrets
        import httpx
        from app.database import AsyncSessionLocal

        async with AsyncSessionLocal() as db:
            if "@" in target or channel == "email":
                if digits == 4 or purpose == "transfer":
                    otp = f"{secrets.randbelow(9000) + 1000}"
                    subject = "Transfer Authorization Code - Prescott National Bank"
                    heading = "Transfer Authorization"
                    description = "Please enter the following 4-digit authorization code to complete your transfer. This code is valid for 10 minutes."
                else:
                    otp = f"{secrets.randbelow(900000) + 100000}"
                    subject = "Account Verification Code - Prescott National Bank"
                    heading = "Verify Your Account"
                    description = "Please enter the following 6-digit verification code to verify your account. This code is valid for 10 minutes."

                expiry = int(time.time()) + 600 # 10 minutes
                
                # Update user OTP fields in DB
                query = await db.execute(select(User).filter(User.email == target))
                user = query.scalars().first()
                if not user:
                    raise ValueError("User email not found")
                
                user.otp_code = otp
                user.otp_expires_at = expiry
                await db.commit()

                # Call Resend API programmatically
                if settings.RESEND_API_KEY:
                    headers = {
                        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                        "Content-Type": "application/json"
                    }
                    html_content = f"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="utf-8">
                      <title>{subject}</title>
                      <style>
                        body {{ background-color: #04060c; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px 20px; }}
                        .container {{ max-width: 500px; margin: 0 auto; background-color: #0c0f19; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 40px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
                        .logo {{ font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 1px; margin-bottom: 24px; }}
                        .logo span {{ color: #1faa6e; font-weight: 500; }}
                        h1 {{ font-size: 22px; font-weight: 600; margin-bottom: 12px; color: #ffffff; }}
                        p {{ font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 32px; }}
                        .code-card {{ background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 16px; padding: 24px; font-size: 36px; font-weight: bold; color: #ffffff; letter-spacing: 8px; margin: 24px 0; font-family: Courier, monospace; }}
                        .footer {{ font-size: 11px; color: #64748b; margin-top: 40px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 24px; line-height: 1.5; }}
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <div class="logo">PRESCOTT <span>NATIONAL</span></div>
                        <h1>{heading}</h1>
                        <p>{description}</p>
                        <div class="code-card">{otp}</div>
                        <p style="font-size: 12px; margin-top: 16px; color: #64748b;">If you did not initiate this request, please contact security immediately.</p>
                        <div class="footer">
                          Prescott National Bank • Member FDIC • Equal Housing Lender<br>
                          © 2026 Prescott National Bank. All rights reserved.
                        </div>
                      </div>
                    </body>
                    </html>
                    """
                    payload = {
                        "from": settings.RESEND_FROM_EMAIL,
                        "to": [target],
                        "subject": subject,
                        "html": html_content
                    }
                    try:
                        async with httpx.AsyncClient() as client:
                            resp = await client.post("https://api.resend.com/emails", json=payload, headers=headers)
                            if resp.status_code >= 400:
                                logger.error(f"Resend returned error status {resp.status_code}: {resp.text}")
                    except Exception as e:
                        logger.error(f"Failed to deliver Resend email: {str(e)}")
                else:
                    logger.warning(f"Resend is not configured. Logged OTP: {otp}")
                
                return True
            else:
                # SMS OTP via Stytch
                if not stytch_client:
                    raise ValueError("Stytch OTP service is not initialized")
                
                try:
                    # Trigger Stytch SMS OTP
                    response = stytch_client.otps.sms.login_or_create(
                        phone_number=target,
                        expiration_minutes=10
                    )
                    phone_id = response.phone_id
                    
                    # Store phone_id in user's otp_code
                    query = await db.execute(select(User).filter(User.phone_number == target))
                    user = query.scalars().first()
                    if user:
                        user.otp_code = phone_id
                        user.otp_expires_at = int(time.time()) + 600
                        await db.commit()
                        
                    logger.info(f"Stytch SMS OTP sent successfully to {target}")
                    return True
                except Exception as e:
                    logger.error(f"Failed to send Stytch SMS OTP to {target}: {str(e)}")
                    raise ValueError(f"SMS OTP send failed: {str(e)}")

    @staticmethod
    async def verify_otp(target: str, code: str, channel: str = "email") -> bool:
        """
        Authenticates an OTP code:
        - If channel is 'email', validates the code and expiry stored in the database.
        - If channel is 'sms', verifies the code via Stytch authenticate API using the stored phone_id/method_id.
        """
        from app.database import AsyncSessionLocal

        async with AsyncSessionLocal() as db:
            if "@" in target or channel == "email":
                query = await db.execute(select(User).filter(User.email == target))
                user = query.scalars().first()
                if not user or not user.otp_code:
                    return False
                
                # Check code and expiry
                if user.otp_code == code and int(time.time()) < user.otp_expires_at:
                    # Clear OTP after verification
                    user.otp_code = None
                    user.otp_expires_at = None
                    await db.commit()
                    return True
                return False
            else:
                query = await db.execute(select(User).filter(User.phone_number == target))
                user = query.scalars().first()
                if not user or not user.otp_code:
                    logger.error("No Stytch phone_id stored for user verification")
                    return False
                
                if not stytch_client:
                    raise ValueError("Stytch OTP service is not initialized")

                try:
                    stytch_client.otps.authenticate(
                        method_id=user.otp_code,
                        code=code
                    )
                    # Clear OTP after verification
                    user.otp_code = None
                    user.otp_expires_at = None
                    await db.commit()
                    return True
                except Exception as e:
                    logger.error(f"Stytch OTP verification failed for {target}: {str(e)}")
                    return False

    @staticmethod
    async def send_reset_email(email: str, app_url: str = "https://prescottnational.com") -> bool:
        """
        Generates a signed 1-hour password reset token and sends a reset link
        to the user's email address via Resend.
        """
        import secrets
        import httpx

        # Build a short-lived signed token (reuse Fernet — expires in 1 hour)
        expiry = int(time.time()) + 3600
        payload = json.dumps({"email": email, "exp": expiry, "purpose": "reset"})
        token = fernet.encrypt(payload.encode()).decode()
        reset_url = f"{app_url}/reset-password?token={token}"

        if not settings.RESEND_API_KEY:
            logger.warning(f"Resend not configured. Reset URL would have been: {reset_url}")
            return True  # Still return True so the frontend shows the generic confirmation

        headers = {
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
        }
        html_body = f"""
        <p>You requested a password reset for your Prescott National Bank account.</p>
        <p>
          <a href=\"{reset_url}\" style=\"color:#0047AB;font-weight:bold;\">
            Reset your password
          </a>
        </p>
        <p>This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>
        """
        payload_data = {
            "from": settings.RESEND_FROM_EMAIL,
            "to": [email],
            "subject": "Password Reset — Prescott National Bank",
            "html": html_body,
        }
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "https://api.resend.com/emails",
                    json=payload_data,
                    headers=headers,
                )
                if resp.status_code >= 400:
                    logger.error(f"Resend reset email failed {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Failed to send reset email: {str(e)}")

        return True

    @staticmethod
    async def register_user(db: AsyncSession, register_data: Dict[str, Any]) -> User:
        """
        Registers a new user and creates their primary account.
        All checks and updates run in a single atomic transaction block.
        """
        # Validate unique email
        email_check = await db.execute(select(User).filter(User.email == register_data["email"]))
        if email_check.scalars().first():
            raise ValueError("User already has an account. Please log in.")

        # Validate unique username
        username_check = await db.execute(select(User).filter(User.username == register_data["username"]))
        if username_check.scalars().first():
            raise ValueError("Username is already taken")

        # Hash password with salt + pepper
        salt = generate_salt()
        pwd_hash = hash_password(register_data["password"], salt)
        
        # Derive currency from country
        currency = get_currency_for_country(register_data["country"])

        role = UserRole.USER

        # Create user
        user = User(
            email=register_data["email"],
            username=register_data["username"],
            full_name=register_data["full_name"],
            password_hash=pwd_hash,
            salt=salt,
            phone_number=register_data.get("phone_number"),
            dob=register_data.get("dob"),
            sex=register_data.get("sex"),
            is_verified=False,
            is_approved=False,
            country=register_data["country"],
            state=register_data["state"],
            city=register_data["city"],
            zip_code=register_data["zip_code"],
            role=role,
            currency=currency
        )
        db.add(user)
        await db.flush() # Populate user.id

        # Generate unique account number: 9 digits for US/CA, 8 digits for UK
        import secrets
        from app.models.user import CountryType
        is_uk = user.country == CountryType.UK
        length = 8 if is_uk else 9
        
        # Generate unique checking account number (120xxxxxxx)
        checking_num = None
        while True:
            digits = "120" + "".join(secrets.choice("0123456789") for _ in range(7))
            check = await db.execute(select(Account).filter(Account.checking_account_number == digits))
            if not check.scalars().first():
                checking_num = digits
                break

        # Generate unique savings account number (550xxxxxxx)
        savings_num = None
        while True:
            digits = "550" + "".join(secrets.choice("0123456789") for _ in range(7))
            check = await db.execute(select(Account).filter(Account.savings_account_number == digits))
            if not check.scalars().first():
                savings_num = digits
                break
                
        routing_num = None if is_uk else "121175254"

        # Create primary banking account
        account = Account(
            user_id=user.id,
            balance=0.0000,
            checking_balance=0.0000,
            checking_account_number=checking_num,
            savings_balance=0.0000,
            savings_account_number=savings_num,
            credit_balance=0.0000,
            credit_account_number=None,
            currency=currency,
            account_number=checking_num,
            routing_number=routing_num
        )
        db.add(account)
        
        # Create default notification preferences
        from app.models.notification import NotificationPreference
        prefs = NotificationPreference(user_id=user.id)
        db.add(prefs)

        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def send_welcome_email(email: str, full_name: str) -> bool:
        """
        Sends a long, beautifully-styled welcome HTML email to newly verified users.
        """
        import httpx
        if not settings.RESEND_API_KEY:
            logger.warning(f"Resend is not configured. Welcome email skipped for {email}.")
            return False

        app_url = getattr(settings, "APP_URL", "https://prescottnational.com")
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Prescott National Bank</title>
          <style>
            body {{ background-color: #04060c; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #0c0f19; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 48px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
            .logo {{ font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 1px; margin-bottom: 32px; text-align: center; }}
            .logo span {{ color: #82C8E5; font-weight: 500; }}
            h1 {{ font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #ffffff; text-align: center; }}
            p {{ font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }}
            .feature-card {{ background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin-bottom: 16px; }}
            .feature-title {{ font-size: 14px; font-weight: 700; color: #ffffff; margin: 0 0 4px 0; }}
            .feature-desc {{ font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.5; }}
            .cta-button {{ display: block; text-align: center; background-color: #ffffff; color: #000000; font-weight: bold; font-size: 14px; padding: 14px 24px; border-radius: 14px; text-decoration: none; margin: 32px 0 24px 0; }}
            .footer {{ font-size: 11px; color: #64748b; margin-top: 40px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 24px; line-height: 1.5; text-align: center; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">PRESCOTT <span>NATIONAL</span></div>
            <h1>Welcome, {full_name}!</h1>
            <p>We are excited to welcome you to Prescott National Bank. Your online personal checking account is now initialized and ready for deployment. Experience high-end banking with instant settlements and advanced security controls.</p>
            
            <div class="feature-card">
              <p class="feature-title">💸 Instant Express Transfers</p>
              <p class="feature-desc">Send funds to any Prescott National Bank user instantly by username, or configure standard external bank transfers.</p>
            </div>

            <div class="feature-card">
              <p class="feature-title">💳 Premium Virtual Debit Cards</p>
              <p class="feature-desc">Generate virtual Visa debit cards, set custom spending limits, and freeze/unfreeze them instantly.</p>
            </div>

            <div class="feature-card">
              <p class="feature-title">🏦 CashApp & PayPal Deposits</p>
              <p class="feature-desc">Load funds easily via check camera uploads or secure social payment references.</p>
            </div>

            <a href="{app_url}/dashboard" class="cta-button">Go to Dashboard</a>

            <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px;">All deposits at Prescott National Bank are FDIC insured up to $250,000.</p>
            
            <div class="footer">
              © 2026 Prescott National Bank. All rights reserved.<br>
              Member FDIC. Equal Housing Lender.
            </div>
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
            "subject": "Welcome to Prescott National Bank",
            "html": html_content
        }
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post("https://api.resend.com/emails", json=payload, headers=headers)
                if resp.status_code >= 400:
                    logger.error(f"Resend welcome email failed with status {resp.status_code}: {resp.text}")
                    return False
                return True
        except Exception as e:
            logger.error(f"Failed to deliver welcome email via Resend: {str(e)}")
            return False

    @staticmethod
    async def send_account_approved_email(
        email: str,
        full_name: str,
        account_number: Optional[str] = None
    ) -> bool:
        """
        Sends an official bank approval email to a newly approved user.
        """
        import httpx
        if not settings.RESEND_API_KEY:
            logger.warning(f"Resend is not configured. Account approved email skipped for {email}.")
            return False

        app_url = getattr(settings, "APP_URL", "https://prescottnational.com")

        last4 = account_number[-4:] if account_number and len(account_number) >= 4 else "0000"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Your Account Has Been Approved - Prescott National Bank</title>
          <style>
            body {{ background-color: #04060c; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px 20px; }}
            .container {{ max-width: 560px; margin: 0 auto; background-color: #0c0f19; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 44px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
            .logo {{ font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 1px; margin-bottom: 28px; text-align: center; }}
            .logo span {{ color: #1faa6e; font-weight: 500; }}
            .badge {{ display: inline-block; background-color: rgba(31, 170, 110, 0.12); color: #1faa6e; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(31, 170, 110, 0.25); margin-bottom: 20px; }}
            h1 {{ font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #ffffff; text-align: center; }}
            p {{ font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }}
            .card {{ background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 18px; padding: 22px; margin: 24px 0; }}
            .detail-row {{ display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }}
            .detail-row:last-child {{ margin-bottom: 0; }}
            .detail-label {{ color: #64748b; font-weight: 500; }}
            .detail-value {{ color: #ffffff; font-weight: 600; font-family: Courier, monospace; }}
            .btn {{ display: block; text-align: center; background-color: #1faa6e; color: #ffffff; font-weight: 700; font-size: 14px; padding: 15px 24px; border-radius: 14px; text-decoration: none; margin: 30px 0 20px 0; transition: background-color 0.2s; }}
            .btn:hover {{ background-color: #18935e; }}
            .footer {{ font-size: 11px; color: #64748b; margin-top: 36px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 24px; line-height: 1.6; text-align: center; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">PRESCOTT <span>NATIONAL</span></div>
            <div style="text-align: center;">
              <span class="badge">Application Approved</span>
            </div>
            <h1>Welcome, {full_name}!</h1>
            <p>We are pleased to inform you that your application for a Prescott National Bank personal banking account has been verified and officially approved. Your account is now fully active and operational.</p>
            
            <div class="card">
              <div class="detail-row">
                <span class="detail-label">Checking Account</span>
                <span class="detail-value">•••• {last4}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Routing Number</span>
                <span class="detail-value">121175254</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-value" style="color: #1faa6e;">Verified & Active</span>
              </div>
            </div>

            <p style="font-size: 13px; color: #cbd5e1;">You can now securely sign in to your dashboard to fund your account, generate virtual cards, and manage your assets.</p>

            <a href="{app_url}/login" class="btn">Sign In to Your Account</a>

            <div class="footer">
              Prescott National Bank • Member FDIC • Equal Housing Lender<br>
              © 2026 Prescott National Bank. All rights reserved.
            </div>
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
            "subject": "Your Account Has Been Approved - Prescott National Bank",
            "html": html_content
        }
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post("https://api.resend.com/emails", json=payload, headers=headers)
                if resp.status_code >= 400:
                    logger.error(f"Resend account approved email failed with status {resp.status_code}: {resp.text}")
                    return False
                return True
        except Exception as e:
            logger.error(f"Failed to deliver account approved email via Resend: {str(e)}")
            return False

    @staticmethod
    async def send_login_notification_email(
        email: str,
        full_name: str,
        device: str,
        location: str,
        ip_address: str
    ) -> bool:
        """
        Sends a login notification email to notify the user of a new session.
        """
        if not settings.RESEND_API_KEY:
            logger.warning(f"Resend is not configured. Login notification skipped for {email}.")
            return False

        import httpx
        import time

        app_url = getattr(settings, "APP_URL", "https://prescottnational.com")
        change_password_url = f"{app_url}/login"
        support_url = f"mailto:{settings.SUPPORT_EMAIL}"

        headers = {
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json"
        }
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>New Login Alert - Prescott National Bank</title>
          <style>
            body {{ background-color: #04060c; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px 20px; }}
            .container {{ max-width: 500px; margin: 0 auto; background-color: #0c0f19; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 40px; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
            .logo {{ font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 1px; margin-bottom: 24px; text-align: center; }}
            .logo span {{ color: #82C8E5; font-weight: 500; }}
            h1 {{ font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #ffffff; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 12px; }}
            p {{ font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px; }}
            .details-box {{ background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin: 20px 0; }}
            .detail-row {{ display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }}
            .detail-label {{ color: #64748b; font-weight: 500; }}
            .detail-value {{ color: #e2e8f0; font-weight: 600; text-align: right; }}
            .action-box {{ margin-top: 28px; text-align: center; }}
            .btn-link {{ display: inline-block; color: #000000; background-color: #ffffff; text-decoration: none; font-weight: 600; font-size: 13px; padding: 12px 24px; border-radius: 12px; transition: background-color 0.2s; margin-right: 10px; }}
            .btn-link:hover {{ background-color: #e2e8f0; }}
            .btn-secondary {{ display: inline-block; color: #ffffff; background-color: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.1); text-decoration: none; font-weight: 600; font-size: 13px; padding: 12px 24px; border-radius: 12px; transition: background-color 0.2s; }}
            .btn-secondary:hover {{ background-color: rgba(255, 255, 255, 0.15); }}
            .footer {{ font-size: 11px; color: #64748b; margin-top: 40px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 24px; line-height: 1.5; text-align: center; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">PRESCOTT <span>NATIONAL</span></div>
            <h1>New Login Detected</h1>
            <p>Hello {full_name},</p>
            <p>Your Prescott National Bank account was recently accessed from a new device or browser session. Below are the login details:</p>
            
            <div class="details-box">
              <div class="detail-row">
                <span class="detail-label">Device</span>
                <span class="detail-value">{device}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location</span>
                <span class="detail-value">{location}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">IP Address</span>
                <span class="detail-value">{ip_address}</span>
              </div>
              <div class="detail-row" style="margin-bottom: 0;">
                <span class="detail-label">Time</span>
                <span class="detail-value">{timestamp_str}</span>
              </div>
            </div>
            
            <p style="font-size: 13px; color: #ef4444; font-weight: 500; margin-top: 24px;">
              If this login was not authorized by you, please secure your account immediately:
            </p>
            
            <div class="action-box">
              <a href="{change_password_url}" class="btn-link">Change Password</a>
              <a href="{support_url}" class="btn-secondary">Contact Support</a>
            </div>
            
            <div class="footer">
              © 2026 Prescott National Bank. All rights reserved.<br>
              Deposits are FDIC Insured. Equal Housing Lender.
            </div>
          </div>
        </body>
        </html>
        """
        
        payload = {
            "from": settings.RESEND_FROM_EMAIL,
            "to": [email],
            "subject": "Security Alert: New Login Detected for Your Prescott National Bank Account",
            "html": html_content
        }

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post("https://api.resend.com/emails", json=payload, headers=headers)
                if resp.status_code >= 400:
                    logger.error(f"Resend login notification failed with status {resp.status_code}: {resp.text}")
                    return False
                return True
        except Exception as e:
            logger.error(f"Failed to deliver login notification email via Resend: {str(e)}")
            return False

