from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
import uuid

from app.database import get_db
from app.models.user import User, UserRole
from app.services.auth_service import AuthService

# API Key header dependency to extract Authorization header
auth_header = APIKeyHeader(name="Authorization", auto_error=False)

async def get_current_user(
    header_value: str = Depends(auth_header),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency that decodes the session token and retrieves the current authenticated user. Eagerly loads account relation.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not header_value:
        raise credentials_exception

    # Handle "Bearer <token>" prefix
    token = header_value
    if header_value.lower().startswith("bearer "):
        token = header_value[7:]

    # Verify session token
    payload = AuthService.verify_session_token(token)
    if not payload:
        raise credentials_exception

    user_id_str = payload.get("user_id")
    if not user_id_str:
        raise credentials_exception

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    # Query user with eager-loaded account and notification preferences
    query = (
        select(User)
        .filter(User.id == user_id, User.is_active == True)
        .options(
            selectinload(User.account),
            selectinload(User.notification_preferences)
        )
    )
    
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user:
        raise credentials_exception
        
    return user

async def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency that ensures the authenticated user is an administrator.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource"
        )
    return current_user
