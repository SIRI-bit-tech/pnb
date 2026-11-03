import logging
from typing import Any
from ably import AblyRest
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class AblyService:
    def __init__(self):
        self.client = None
        if settings.ABLY_API_KEY:
            try:
                self.client = AblyRest(settings.ABLY_API_KEY)
            except Exception as e:
                logger.error(f"Failed to initialize Ably REST client: {str(e)}")

    async def publish_event(self, channel_name: str, event_name: str, data: Any) -> bool:
        """
        Publishes a real-time event to an Ably channel.
        Fails gracefully without raising exceptions if Ably is not configured or fails.
        """
        if not self.client:
            logger.warning(f"Ably is not configured. Skipping event '{event_name}' on channel '{channel_name}'")
            return False
            
        try:
            channel = self.client.channels.get(channel_name)
            await channel.publish(event_name, data)
            logger.info(f"Published event '{event_name}' to Ably channel '{channel_name}'")
            return True
        except Exception as e:
            logger.error(f"Ably publish failed for event '{event_name}' on channel '{channel_name}': {str(e)}")
            return False

    async def publish_balance_update(self, user_id: str, balance: float, currency: str) -> bool:
        """
        Publishes a real-time balance update for a specific user.
        """
        channel_name = f"user:{user_id}:balance"
        data = {
            "balance": str(balance),
            "currency": currency
        }
        return await self.publish_event(channel_name, "balance.updated", data)

    async def publish_notification(self, user_id: str, notification_data: dict) -> bool:
        """
        Publishes an in-app notification event to a user.
        """
        channel_name = f"user:{user_id}:notifications"
        return await self.publish_event(channel_name, "notification.new", notification_data)

    async def publish_admin_deposit_event(self, deposit_data: dict) -> bool:
        """
        Publishes a new pending deposit notification to the admin dashboard channel.
        """
        return await self.publish_event("admin:deposits", "deposit.new", deposit_data)

    async def publish_admin_card_event(self, card_data: dict) -> bool:
        """
        Publishes a new card request notification to the admin card channel.
        """
        return await self.publish_event("admin:cards", "card.request.new", card_data)

    async def publish_support_message(self, ticket_id: str, message_data: dict, user_id: str = None) -> bool:
        """
        Publishes a real-time support message to the ticket channel, user channel, and admin support channel.
        """
        # Ticket room channel
        await self.publish_event(f"support:ticket:{ticket_id}", "message.new", message_data)
        # Notify user channel if provided
        if user_id:
            await self.publish_event(f"user:{user_id}:support", "support.message", message_data)
        # Notify admin support desk channel
        await self.publish_event("admin:support", "support.message", message_data)
        return True

# Singleton service instance
ably_service = AblyService()
