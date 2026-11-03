from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.database import get_db
from app.models.user import User
from app.services.notification_service import notification_service
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
async def get_notifications(
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves user notifications paginated.
    """
    notifications, total = await notification_service.get_user_notifications(
        db=db,
        user_id=current_user.id,
        page=page,
        page_size=page_size
    )
    return {
        "notifications": notifications,
        "total_count": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the count of unread notifications.
    """
    count = await notification_service.get_unread_count(db=db, user_id=current_user.id)
    return {"unread_count": count}

@router.patch("/read-all")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Marks all notifications for this user as read.
    """
    rows_updated = await notification_service.mark_all_as_read(
        db=db,
        user_id=current_user.id
    )
    return {
        "message": "All notifications marked as read",
        "marked_count": rows_updated
    }

@router.patch("/{id}/read")
async def mark_as_read(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Marks a specific notification as read.
    """
    try:
        noti_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid notification ID format"
        )

    success = await notification_service.mark_as_read(
        db=db,
        user_id=current_user.id,
        notification_id=noti_uuid
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    return {"message": "Notification marked as read"}
