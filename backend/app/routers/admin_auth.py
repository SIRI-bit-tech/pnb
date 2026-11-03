from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import logging

from app.database import get_db
from app.models.user import User, UserRole, CountryType, CurrencyType, Account
from app.schemas.auth import AdminRegisterRequest, AdminLoginRequest, TokenResponse
from app.utils.security import verify_password, hash_password, generate_salt
from app.services.auth_service import AuthService
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/auth", tags=["Admin Authentication"])
settings = get_settings()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def admin_register(data: AdminRegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Registers a new admin. Rejects if an admin already exists or code is invalid.
    """
    if data.admin_code != settings.ADMIN_REGISTRATION_CODE:
        raise HTTPException(status_code=400, detail="Invalid admin code")

    # Check if an admin already exists
    admin_query = await db.execute(select(User).filter(User.role == UserRole.ADMIN))
    if admin_query.scalars().first():
        raise HTTPException(status_code=403, detail="An admin account already exists. Only one admin is allowed.")

    # Check if email is already in use
    email_query = await db.execute(select(User).filter(User.email == data.email))
    if email_query.scalars().first():
        raise HTTPException(status_code=400, detail="Email is already registered")

    salt = generate_salt()
    hashed_password = hash_password(data.password, salt)

    user = User(
        email=data.email,
        username="admin_" + data.email.split("@")[0],  # Generate a dummy username
        full_name="System Administrator",
        password_hash=hashed_password,
        salt=salt,
        country=CountryType.US,  # Dummy data
        state="Admin State",
        city="Admin City",
        zip_code="00000",
        phone_number="000-000-0000",
        is_verified=True,  # Admins don't need verification
        is_approved=True,
        role=UserRole.ADMIN,
        currency=CurrencyType.USD
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Create dummy account for completeness
    account = Account(
        user_id=user.id,
        currency=user.currency
    )
    db.add(account)
    await db.commit()

    return {"message": "Admin registration successful"}


@router.post("/login", response_model=TokenResponse)
async def admin_login(data: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Admin login endpoint protected against timing and enumeration attacks.
    """
    query = await db.execute(select(User).filter(User.email == data.email))
    user = query.scalars().first()

    if not user:
        # Dummy check to keep response times identical
        verify_password(data.password, "dummysalt", "$argon2id$v=19$m=65536,t=3,p=4$ToYnLpBcxc2JOnUgaH409g$rWI3mr/+/DBZFatZPkaczarrcncze0c60QICap/ERns")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Always verify password first
    is_valid = verify_password(data.password, user.salt, user.password_hash)

    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # If it is valid but they are not an admin, return 401 instead of 403 to prevent role enumeration
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Generate token
    token = AuthService.generate_session_token(str(user.id), user.role.value)
    
    return {"access_token": token, "token_type": "bearer"}
