import logging
from uuid import UUID
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, update
from app.models.notification import Notification, NotificationPreference, NotificationType
from app.services.ably_service import ably_service

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    async def create_notification(
        db: AsyncSession,
        user_id: UUID,
        type: NotificationType,
        title: str,
        message: str
    ) -> Notification:
        """
        Creates an in-app notification. Checks user preferences to decide whether to
        dispatch a real-time toast via Ably, and persists the notification.
        """
        # 1. Persist notification
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title[:100] if title else "",
            message=message,
            is_read=False
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)

        # 2. Check notification preferences
        type_str = type.value if hasattr(type, "value") else str(type)
        pref_query = await db.execute(
            select(NotificationPreference).filter(NotificationPreference.user_id == user_id)
        )
        prefs = pref_query.scalars().first()
        
        # If preferences don't exist, default to sending
        should_send_realtime = True
        if prefs:
            if type_str == "transfer":
                should_send_realtime = prefs.transfer_alerts
            elif type_str == "deposit":
                should_send_realtime = prefs.deposit_alerts
            elif type_str == "card":
                should_send_realtime = prefs.card_alerts
            elif type_str == "investment":
                should_send_realtime = prefs.investment_alerts
            elif type_str == "security":
                should_send_realtime = prefs.security_alerts

        # 3. Publish real-time event if preferred
        if should_send_realtime:
            notification_payload = {
                "id": str(notification.id),
                "type": type_str,
                "title": title,
                "message": message,
                "is_read": False,
                "created_at": notification.created_at.isoformat() if notification.created_at else None
            }
            await ably_service.publish_notification(str(user_id), notification_payload)

        await db.commit()
        return notification

    @staticmethod
    async def get_user_notifications(
        db: AsyncSession,
        user_id: UUID,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Notification], int]:
        """
        Retrieves paginated notifications and total count for a user.
        """
        offset = (page - 1) * page_size
        
        # Query total count
        count_query = await db.execute(
            select(Notification).filter(Notification.user_id == user_id)
        )
        total_count = len(count_query.scalars().all())

        # Query notifications ordered by newest first
        noti_query = await db.execute(
            select(Notification)
            .filter(Notification.user_id == user_id)
            .order_by(desc(Notification.created_at))
            .offset(offset)
            .limit(page_size)
        )
        notifications = noti_query.scalars().all()
        return notifications, total_count

    @staticmethod
    async def get_unread_count(db: AsyncSession, user_id: UUID) -> int:
        """
        Returns count of unread notifications.
        """
        unread_query = await db.execute(
            select(Notification).filter(Notification.user_id == user_id, Notification.is_read == False)
        )
        return len(unread_query.scalars().all())

    @staticmethod
    async def mark_as_read(db: AsyncSession, user_id: UUID, notification_id: UUID) -> bool:
        """
        Marks a specific notification as read.
        """
        result = await db.execute(
            update(Notification)
            .filter(Notification.id == notification_id, Notification.user_id == user_id)
            .values(is_read=True)
        )
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def mark_all_as_read(db: AsyncSession, user_id: UUID) -> int:
        """
        Marks all notifications as read for a user.
        """
        result = await db.execute(
            update(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True)
        )
        await db.commit()
        return result.rowcount

# Singleton service instance
notification_service = NotificationService()
