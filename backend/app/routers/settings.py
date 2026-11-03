from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.user import User, Account
from app.models.notification import NotificationPreference
from app.schemas.user import UserResponse, ProfileUpdateRequest, AccountResponse, SecurityUpdateRequest
from app.schemas.notification import NotificationPreferenceResponse, NotificationPreferenceUpdate
from app.schemas.auth import TwoFactorSetupResponse, TwoFactorVerifyRequest, TwoFactorDisableRequest, DeleteAccountVerifyRequest
from app.services.deposit_service import upload_image_to_uploadthing
from app.services.auth_service import AuthService
from app.utils.validators import get_currency_for_country, get_states_for_country, validate_zip_code
from app.utils.security import verify_password, generate_salt, hash_password
from app.utils.totp import generate_totp_secret, get_totp_uri, verify_totp_code
from app.middleware.auth import get_current_user
import urllib.parse

router = APIRouter(prefix="/settings", tags=["User Settings"])

@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """
    Returns the current authenticated user's profile details.
    """
    return current_user

@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates profile details. Handles address validation and automatic currency updating.
    """
    # KYC Protection: Users cannot change location, DOB, gender, email, or phone number
    if any([
        data.country is not None and data.country != current_user.country,
        data.state is not None and data.state != current_user.state,
        data.zip_code is not None and data.zip_code != current_user.zip_code,
        data.dob is not None and data.dob != current_user.dob,
        data.sex is not None and data.sex != current_user.sex,
        data.email is not None and data.email.lower() != current_user.email.lower(),
        data.phone_number is not None and data.phone_number.strip() != (current_user.phone_number or "").strip(),
    ]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Personal KYC details and verified contact information (Email, Phone, Date of Birth, Gender, and Location) are locked and can only be updated by a bank administrator."
        )

    # 1. Update Username if modified (check unique)
    if data.username and data.username != current_user.username:
        username_check = await db.execute(
            select(User).filter(User.username == data.username, User.id != current_user.id)
        )
        if username_check.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken"
            )
        current_user.username = data.username

    # 2. Update Full Name if provided
    if data.full_name:
        current_user.full_name = data.full_name

    # 3. Update Avatar if provided
    if data.profile_image_url:
        current_user.profile_image_url = data.profile_image_url

    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Uploads a profile picture/avatar to UploadThing.
    """
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile picture must be JPG, JPEG or PNG"
        )
        
    try:
        file_bytes = await file.read()
        avatar_url = await upload_image_to_uploadthing(file_bytes)
        
        if not avatar_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Avatar upload to storage failed"
            )
            
        current_user.profile_image_url = avatar_url
        await db.commit()
        
        return {"profile_image_url": avatar_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/notifications", response_model=NotificationPreferenceResponse)
async def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns user notification alert preferences.
    """
    if not current_user.notification_preferences:
        # Create default preferences if missing
        prefs = NotificationPreference(user_id=current_user.id)
        db.add(prefs)
        await db.commit()
        await db.refresh(current_user)
        
    return current_user.notification_preferences

@router.patch("/notifications", response_model=NotificationPreferenceResponse)
async def update_notification_preferences(
    data: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Modifies user notification alert toggles.
    """
    prefs = current_user.notification_preferences
    if not prefs:
        prefs = NotificationPreference(user_id=current_user.id)
        db.add(prefs)

    # Apply updates
    if data.transfer_alerts is not None:
        prefs.transfer_alerts = data.transfer_alerts
    if data.deposit_alerts is not None:
        prefs.deposit_alerts = data.deposit_alerts
    if data.investment_alerts is not None:
        prefs.investment_alerts = data.investment_alerts
    if data.card_alerts is not None:
        prefs.card_alerts = data.card_alerts
    if data.security_alerts is not None:
        prefs.security_alerts = data.security_alerts

    await db.commit()
    await db.refresh(prefs)
    return prefs

@router.patch("/security")
async def update_security(
    data: SecurityUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates user password or transaction PIN after verifying current values.
    """
    # 1. Update Password
    if data.new_password:
        if not data.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required to set a new password"
            )
        if not verify_password(data.current_password, current_user.salt, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid current password"
            )
        
        salt = generate_salt()
        new_hash = hash_password(data.new_password, salt)
        current_user.password_hash = new_hash
        current_user.salt = salt

    # 2. Update PIN
    if data.new_pin:
        if current_user.transaction_pin_hash:
            if not data.current_pin:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Current PIN is required to change your transaction PIN"
                )
            if not verify_password(data.current_pin, current_user.transaction_pin_salt, current_user.transaction_pin_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid current transaction PIN"
                )
        
        salt = generate_salt()
        new_pin_hash = hash_password(data.new_pin, salt)
        current_user.transaction_pin_hash = new_pin_hash
        current_user.transaction_pin_salt = salt

    await db.commit()
    return {"message": "Security settings updated successfully"}

@router.get("/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_two_factor(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates a new TOTP secret key and QR code URL for two-factor authentication setup.
    The secret is temporarily saved until verified.
    """
    secret = generate_totp_secret()
    current_user.two_factor_secret = secret
    await db.commit()

    otpauth_url = get_totp_uri(secret, current_user.email, issuer="Prescott National Bank")
    qr_image_url = f"https://api.qrserver.com/v1/create-qr-code/?size=240x240&data={urllib.parse.quote(otpauth_url)}"

    return TwoFactorSetupResponse(
        secret=secret,
        otpauth_url=otpauth_url,
        qr_image_url=qr_image_url
    )

@router.post("/2fa/enable")
async def enable_two_factor(
    data: TwoFactorVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verifies the 6-digit TOTP code and activates two-factor authentication on the account.
    """
    if not current_user.two_factor_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-factor authentication setup has not been initiated. Please request a QR code first."
        )

    is_valid = verify_totp_code(current_user.two_factor_secret, data.code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 6-digit code. Please verify the code displayed in your authenticator app and try again."
        )

    current_user.two_factor_enabled = True
    await db.commit()

    return {
        "message": "Two-factor authentication has been successfully activated.",
        "two_factor_enabled": True
    }

@router.post("/2fa/disable")
async def disable_two_factor(
    data: TwoFactorDisableRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Disables two-factor authentication after verifying a current code or account password.
    """
    if not current_user.two_factor_enabled:
        return {"message": "Two-factor authentication is already disabled.", "two_factor_enabled": False}

    code_input = data.code.strip()
    is_valid = False

    # 1. Try TOTP authenticator code if 6 digits
    if len(code_input) == 6 and code_input.isdigit():
        is_valid = verify_totp_code(current_user.two_factor_secret, code_input)

    # 2. If not valid TOTP code (or user provided account password), verify account password
    if not is_valid:
        if current_user.password_hash and current_user.salt:
            is_valid = verify_password(code_input, current_user.salt, current_user.password_hash)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code or password."
        )

    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    await db.commit()

    return {
        "message": "Two-factor authentication has been disabled.",
        "two_factor_enabled": False
    }

@router.post("/delete-account/request-otp")
async def request_delete_account_otp(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Dispatches a 6-digit high-security verification code to the user's email address to authorize account closure.
    """
    try:
        await AuthService.send_otp(current_user.email, "email")
        return {
            "message": "A 6-digit security code has been sent to your registered email address to authorize account deletion."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to dispatch security code: {str(e)}"
        )

@router.post("/delete-account/verify-otp")
async def verify_delete_account_otp(
    data: DeleteAccountVerifyRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Validates the 6-digit security code prior to showing the irreversible confirmation dialog.
    """
    is_valid = await AuthService.verify_otp(current_user.email, data.otp_code.strip(), "email")
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code."
        )

    return {
        "valid": True,
        "message": "Security authorization confirmed."
    }

@router.post("/delete-account/confirm")
async def confirm_delete_account(
    data: DeleteAccountVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Permanently deletes and closes the user's account and all associated banking data.
    """
    is_valid = await AuthService.verify_otp(current_user.email, data.otp_code.strip(), "email")
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security code has expired or is invalid. Please request a new code."
        )

    # Permanently delete the user account (cascade deletes accounts, deposits, cards, etc.)
    await db.delete(current_user)
    await db.commit()

    return {
        "message": "Your Prescott National Bank account and all associated banking profiles have been permanently closed."
    }

