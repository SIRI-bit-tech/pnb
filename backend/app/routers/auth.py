from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
import logging

from app.database import get_db
from app.models.user import User, CountryType, Account, UserRole
from app.schemas.auth import (
    RegisterRequest, 
    LoginRequest,
    ForgotPasswordRequest,
    SendOTPRequest,
    OTPVerifyRequest, 
    CreatePinRequest,
    TokenResponse
)
from app.schemas.user import UserResponse, AccountResponse
from app.services.auth_service import AuthService
from app.utils.security import verify_password, generate_salt, hash_password
from app.utils.totp import verify_totp_code
from app.middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Registers a new user profile. Verification is handled in the next step.
    """
    try:
        # Create user + account in DB
        user = await AuthService.register_user(db, data.model_dump())
        
        # Trigger initial verification code immediately
        try:
            await AuthService.send_otp(user.email, "email")
        except Exception as otp_err:
            logger.error(f"Failed to send initial registration OTP to {user.email}: {otp_err}")
            
        return {
            "message": "Registration successful. Please proceed to verify your account.",
            "email": user.email,
            "phone_number": user.phone_number
        }
    except ValueError as e:
        logger.warning(f"Registration validation warning: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Internal registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration. Please try again later."
        )

@router.post("/send-code")
async def send_code(
    data: SendOTPRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Sends an OTP code via Resend (email) or Stytch (SMS).
    """
    try:
        query = await db.execute(select(User).filter(User.email == data.email))
        user = query.scalars().first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User account not found"
            )

        target = user.email
        await AuthService.send_otp(target, "email")
        return {
            "message": "Verification code sent to your email.",
            "email": user.email
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Internal send-code error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification code. Please try again."
        )

@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Accepts a username, looks up the associated email, and dispatches a
    Fernet-signed password reset link via Resend. Always returns 200 to
    prevent username enumeration attacks.
    """
    try:
        clean_username = data.username.strip().lower()
        query = await db.execute(
            select(User).filter(func.lower(User.username) == clean_username, User.is_active == True)
        )
        user = query.scalars().first()

        # Silently succeed even if user not found — prevents enumeration
        if user:
            app_url = getattr(settings, "APP_URL", "https://prescottnational.com")
            await AuthService.send_reset_email(user.email, app_url)

    except Exception as e:
        logger.error(f"Internal forgot-password error: {str(e)}")
        # Still return 200 to avoid leaking whether the username exists

    return {
        "message": "If an account with that username exists, a reset link has been sent to the associated email."
    }

@router.post("/login")
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Validates credentials and triggers email OTP code for 2FA.
    """
    try:
        # Fetch user by username (case-insensitive)
        clean_username = data.username.strip().lower()
        query = await db.execute(select(User).filter(func.lower(User.username) == clean_username))
        user = query.scalars().first()
        
        if not user or not verify_password(data.password, user.salt, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )

        if not getattr(user, "is_approved", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No account found"
            )
            
        if not user.is_active:
            reason = user.ban_reason or "Violation of terms of service"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"BANNED:{reason}"
            )
            
        from app.models.user import UserRole
        if user.role == UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrators must login via the admin portal."
            )
            
        # Check if user has Two-Factor Authentication (2FA) enabled
        if getattr(user, "two_factor_enabled", False):
            return {
                "message": "Two-factor authentication required.",
                "email": user.email,
                "two_factor_required": True,
                "methods": ["totp", "email"],
                "is_verified": user.is_verified,
                "has_pin": True
            }

        # Trigger email OTP code for standard users without 2FA
        await AuthService.send_otp(user.email, "email")
        
        return {
            "message": "Credentials verified. A verification code has been sent to your email.",
            "email": user.email,
            "two_factor_required": False,
            "is_verified": user.is_verified,
            "has_pin": user.transaction_pin_hash is not None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Internal login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login authentication failed. Please try again."
        )

def parse_user_agent(user_agent_str: str) -> str:
    if not user_agent_str:
        return "Unknown Device"
    ua = user_agent_str.lower()
    
    # Parse OS
    if "windows" in ua:
        os_name = "Windows"
    elif "macintosh" in ua or "mac os" in ua:
        os_name = "macOS"
    elif "iphone" in ua or "ipad" in ua:
        os_name = "iOS Device"
    elif "android" in ua:
        os_name = "Android Device"
    elif "linux" in ua:
        os_name = "Linux"
    else:
        os_name = "Unknown OS"
        
    # Parse Browser
    if "chrome" in ua or "crios" in ua:
        browser = "Chrome"
    elif "safari" in ua and "chrome" not in ua:
        browser = "Safari"
    elif "firefox" in ua or "fxios" in ua:
        browser = "Firefox"
    elif "edge" in ua or "edg" in ua:
        browser = "Edge"
    elif "opera" in ua or "opr" in ua:
        browser = "Opera"
    else:
        browser = "Browser"
        
    return f"{browser} on {os_name}"

def get_client_ip(request: Request) -> str:
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    x_real_ip = request.headers.get("x-real-ip")
    if x_real_ip:
        return x_real_ip
    return request.client.host if request.client else "127.0.0.1"

def is_private_or_loopback_ip(ip: str) -> bool:
    if not ip:
        return True
    ip = ip.strip()
    if ip in ("127.0.0.1", "::1", "localhost", "::ffff:127.0.0.1"):
        return True
    # Check private IP ranges
    if ip.startswith("10.") or ip.startswith("192.168."):
        return True
    if ip.startswith("172."):
        try:
            parts = ip.split(".")
            if len(parts) >= 2:
                second_octet = int(parts[1])
                return 16 <= second_octet <= 31
        except Exception:
            pass
    return False

async def get_ip_location_and_ip(ip: str) -> tuple[str, str]:
    use_fallback = is_private_or_loopback_ip(ip)
    url = "http://ip-api.com/json/" if use_fallback else f"http://ip-api.com/json/{ip}"
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=4.0)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "success":
                    city = data.get("city")
                    region = data.get("regionName")
                    country = data.get("country")
                    resolved_ip = data.get("query", ip)
                    if city and region:
                        loc = f"{city}, {region}"
                    elif city:
                        loc = f"{city}, {country}"
                    else:
                        loc = country
                    return loc, resolved_ip
    except Exception as e:
        logger.error(f"Failed to fetch GeoIP location for {ip}: {e}")
    return "Unknown Location", ip

async def process_login_security_notification(email: str, full_name: str, device: str, ip_address: str):
    try:
        location, resolved_ip = await get_ip_location_and_ip(ip_address)
        await AuthService.send_login_notification_email(
            email=email,
            full_name=full_name,
            device=device,
            location=location,
            ip_address=resolved_ip
        )
    except Exception as e:
        logger.error(f"Error processing login security notification background task: {e}")

@router.post("/verify-otp")
async def verify_otp(
    data: OTPVerifyRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Verifies the OTP code. Returns session token if user is already verified and has set a PIN.
    Triggers geolocation-aware login notification email if they are already fully onboarded.
    """
    try:
        query = await db.execute(select(User).filter(User.email == data.email))
        user = query.scalars().first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Check verification code based on method or 2FA state
        is_valid = False
        method = getattr(data, "method", "email") or "email"
        
        if method == "totp" or (getattr(user, "two_factor_enabled", False) and method != "email"):
            if user.two_factor_secret:
                is_valid = verify_totp_code(user.two_factor_secret, data.otp_code)
            if not is_valid:
                # Fallback to email OTP check in case user entered email OTP
                is_valid = await AuthService.verify_otp(user.email, data.otp_code, "email")
        else:
            # Email OTP verification
            is_valid = await AuthService.verify_otp(user.email, data.otp_code, "email")
            if not is_valid and getattr(user, "two_factor_enabled", False) and user.two_factor_secret:
                # Fallback to TOTP code in case user entered authenticator code in email field
                is_valid = verify_totp_code(user.two_factor_secret, data.otp_code)

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code is invalid or has expired."
            )

        # Update user verification status in DB
        if not user.is_verified:
            user.is_verified = True
            await db.commit()
            await db.refresh(user)

        # Check if user account is approved by admin compliance
        is_user_approved = getattr(user, "is_approved", True)
        if not is_user_approved and user.role != UserRole.ADMIN:
            return {
                "message": "Email verified successfully. Your account is currently under compliance review.",
                "is_verified": True,
                "is_approved": False,
                "status": "under_review",
                "email": user.email
            }

        # Always set has_pin = True so approved users bypass create-pin and go straight to dashboard
        has_pin = True
        
        # Trigger login security alert notification
        ip_address = get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        device = parse_user_agent(user_agent)
        
        background_tasks.add_task(
            process_login_security_notification,
            user.email,
            user.full_name,
            device,
            ip_address
        )

        # Generate session token upon valid OTP verification for approved users
        token = AuthService.generate_session_token(str(user.id), user.role.value)

        return {
            "message": "Verification code accepted.",
            "is_verified": True,
            "is_approved": True,
            "has_pin": True,
            "access_token": token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Internal verify-otp error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Verification processing failed. Please try again."
        )

@router.post("/create-pin", response_model=TokenResponse)
async def create_pin(
    data: CreatePinRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Creates the 4-digit transaction PIN and completes onboarding, returning the session token.
    Sends welcome email on onboarding completion.
    """
    try:
        query = await db.execute(select(User).filter(User.email == data.email))
        user = query.scalars().first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User account not found"
            )

        # Hash and store transaction PIN
        salt = generate_salt()
        pin_hash = hash_password(data.pin, salt)
        
        user.transaction_pin_hash = pin_hash
        user.transaction_pin_salt = salt
        user.is_verified = True
        await db.commit()

        # Send welcome email on successful completion of onboarding!
        try:
            background_tasks.add_task(AuthService.send_welcome_email, user.email, user.full_name)
        except Exception as mail_err:
            logger.error(f"Failed to add welcome email background task: {str(mail_err)}")

        # Generate session token
        token = AuthService.generate_session_token(str(user.id), user.role.value)
        return TokenResponse(
            access_token=token,
            token_type="bearer"
        )
    except Exception as e:
        logger.error(f"Internal create-pin error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record transaction PIN. Please try again."
        )

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves current user details.
    """
    return current_user

@router.get("/me/account", response_model=AccountResponse)
async def get_me_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves the current user's primary bank account details (balance, currency, account number, routing number).
    """
    if not current_user.account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Lazy generate if not present
    if not current_user.account.account_number:
        import secrets
        is_uk = current_user.country == CountryType.UK
        length = 8 if is_uk else 9
        
        account_num = None
        while True:
            digits = "".join(secrets.choice("0123456789") for _ in range(length))
            if digits[0] == "0":
                continue
            
            # Check uniqueness in DB
            check = await db.execute(select(Account).filter(Account.account_number == digits))
            if not check.scalars().first():
                account_num = digits
                break
                
        current_user.account.account_number = account_num
        current_user.account.routing_number = None if is_uk else "121175254"
        db.add(current_user.account)
        await db.commit()

    # Lazy generate checking/savings details for migrated accounts if missing
    if not current_user.account.checking_account_number:
        import secrets
        current_user.account.checking_account_number = "120" + "".join(secrets.choice("0123456789") for _ in range(7))
        db.add(current_user.account)
        await db.commit()

    if not current_user.account.savings_account_number:
        import secrets
        current_user.account.savings_account_number = "550" + "".join(secrets.choice("0123456789") for _ in range(7))
        db.add(current_user.account)
        await db.commit()
    
    return AccountResponse(
        id=current_user.account.id,
        balance=current_user.account.balance,
        checking_balance=current_user.account.checking_balance,
        checking_account_number=current_user.account.checking_account_number,
        savings_balance=current_user.account.savings_balance,
        savings_account_number=current_user.account.savings_account_number,
        credit_balance=current_user.account.credit_balance,
        credit_account_number=current_user.account.credit_account_number,
        currency=current_user.account.currency,
        account_number=current_user.account.account_number,
        routing_number=current_user.account.routing_number,
        is_active=current_user.account.is_active,
        is_frozen=current_user.account.is_frozen,
        freeze_reason=getattr(current_user.account, "freeze_reason", None),
        show_spending_summary=getattr(current_user.account, "show_spending_summary", True)
    )

@router.get("/search-users")
async def search_users(
    q: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Search users by username or full name for P2P transfers.
    """
    if len(q) < 2:
        return []
    
    query = await db.execute(
        select(User)
        .filter(
            User.username.ilike(f"{q}%"),
            User.id != current_user.id,
            User.is_active == True
        )
        .limit(10)
    )
    users = query.scalars().all()
    return [{"username": u.username, "full_name": u.full_name} for u in users]


