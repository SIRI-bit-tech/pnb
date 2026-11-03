import logging
from decimal import Decimal
from datetime import datetime, timezone
from uuid import UUID
from typing import Optional, List, Tuple
import anyio
import io
from upyloadthing import UTApi, UTApiOptions
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc

from app.config import get_settings
from app.models.deposit import Deposit, DepositType, DepositStatus
from app.models.user import User, Account
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.services.ably_service import ably_service
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)
settings = get_settings()

# Configure UploadThing if token/secret is present
token = settings.UPLOADTHING_TOKEN or settings.UPLOADTHING_SECRET
ut_api = None
if token:
    try:
        ut_api = UTApi(UTApiOptions(token=token))
    except Exception as e:
        logger.error(f"Failed to configure UploadThing: {str(e)}")

def _upload_to_uploadthing_sync(file_bytes: bytes) -> str:
    """Synchronous UploadThing upload helper."""
    if not ut_api:
        raise ValueError("UploadThing is not configured")
    file_obj = io.BytesIO(file_bytes)
    file_obj.name = "upload.png"
    result = ut_api.upload_files(file_obj)
    if hasattr(result, "url"):
        return result.url
    elif isinstance(result, list) and len(result) > 0 and hasattr(result[0], "url"):
        return result[0].url
    elif isinstance(result, dict) and "url" in result:
        return result["url"]
    raise ValueError(f"Unexpected UploadThing response: {result}")

async def upload_image_to_uploadthing(file_bytes: bytes) -> Optional[str]:
    """
    Asynchronously uploads file bytes to UploadThing in a worker thread.
    Returns the secure URL on success, or None on failure.
    """
    token_check = settings.UPLOADTHING_TOKEN or settings.UPLOADTHING_SECRET
    if not token_check:
        logger.warning("UploadThing token/secret is not configured. Skipping upload.")
        return None
        
    try:
        result = await anyio.to_thread.run_sync(_upload_to_uploadthing_sync, file_bytes)
        return result
    except Exception as e:
        logger.error(f"UploadThing upload failed: {str(e)}")
        return None

class DepositService:
    @staticmethod
    async def create_check_deposit(
        db: AsyncSession,
        user: User,
        amount: Decimal,
        front_bytes: bytes,
        back_bytes: bytes
    ) -> Deposit:
        """
        Creates a pending check deposit. Uploads front and back images to UploadThing.
        """
        front_url = await upload_image_to_uploadthing(front_bytes)
        back_url = await upload_image_to_uploadthing(back_bytes)
        
        if not front_url or not back_url:
            raise ValueError("Failed to upload check images to storage. Please try again.")

        deposit = Deposit(
            user_id=user.id,
            type=DepositType.CHECK,
            amount=amount,
            status=DepositStatus.PENDING,
            image_front_url=front_url,
            image_back_url=back_url
        )
        db.add(deposit)
        await db.commit()
        await db.refresh(deposit)

        # Notify admins in real-time
        try:
            await ably_service.publish_admin_deposit_event({
                "id": str(deposit.id),
                "username": user.username,
                "amount": str(deposit.amount),
                "type": deposit.type.value,
                "created_at": deposit.created_at.isoformat() if deposit.created_at else None
            })
        except Exception as e:
            logger.error(f"Failed to publish admin event: {str(e)}")

        return deposit

    @staticmethod
    async def create_external_deposit(
        db: AsyncSession,
        user: User,
        type: DepositType,
        amount: Decimal,
        reference_id: Optional[str] = None
    ) -> Deposit:
        """
        Creates a pending CashApp or PayPal deposit request based on user declaration.
        """
        if type not in [DepositType.CASHAPP, DepositType.PAYPAL]:
            raise ValueError("Invalid deposit type for external validation")

        deposit = Deposit(
            user_id=user.id,
            type=type,
            amount=amount,
            status=DepositStatus.PENDING,
            reference_id=reference_id
        )
        db.add(deposit)
        await db.commit()
        await db.refresh(deposit)

        # Notify admins in real-time
        try:
            await ably_service.publish_admin_deposit_event({
                "id": str(deposit.id),
                "username": user.username,
                "amount": str(deposit.amount),
                "type": deposit.type.value,
                "created_at": deposit.created_at.isoformat() if deposit.created_at else None
            })
        except Exception as e:
            logger.error(f"Failed to publish admin event: {str(e)}")

        return deposit

    @staticmethod
    async def get_user_deposits(
        db: AsyncSession,
        user_id: UUID,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Deposit], int]:
        """
        Retrieves paginated deposits list for a user.
        """
        offset = (page - 1) * page_size
        
        count_query = await db.execute(
            select(Deposit).filter(Deposit.user_id == user_id)
        )
        total_count = len(count_query.scalars().all())

        dep_query = await db.execute(
            select(Deposit)
            .filter(Deposit.user_id == user_id)
            .order_by(desc(Deposit.created_at))
            .offset(offset)
            .limit(page_size)
        )
        deposits = dep_query.scalars().all()
        return deposits, total_count

    @staticmethod
    async def review_deposit(
        db: AsyncSession,
        deposit_id: UUID,
        status: DepositStatus,
        admin_notes: Optional[str],
        reviewer: User
    ) -> Deposit:
        """
        Reviews a pending deposit. If confirmed, adds the funds to the user's account balance
        and writes a transaction history record. Triggers Ably updates and notifications.
        """
        # 1. Fetch deposit
        dep_query = await db.execute(
            select(Deposit).filter(Deposit.id == deposit_id).with_for_update()
        )
        deposit = dep_query.scalars().first()
        if not deposit:
            raise ValueError("Deposit record not found")
        if deposit.status != DepositStatus.PENDING:
            raise ValueError("Deposit has already been reviewed")

        # 2. Lock and load user account
        acc_query = await db.execute(
            select(Account).filter(Account.user_id == deposit.user_id).with_for_update()
        )
        account = acc_query.scalars().first()
        if not account:
            raise ValueError("Recipient banking account profile not found")

        # 3. Update deposit status
        deposit.status = status
        deposit.admin_notes = admin_notes
        deposit.reviewed_at = datetime.now(timezone.utc)
        deposit.reviewed_by = reviewer.id

        if status == DepositStatus.CONFIRMED:
            # Credit checking balance
            account.checking_balance += deposit.amount
            # Update total balance
            account.balance = account.checking_balance + account.savings_balance + account.credit_balance
            
            # Record banking transaction
            transaction = Transaction(
                from_account_id=None,
                to_account_id=account.id,
                type=TransactionType.DEPOSIT,
                amount=deposit.amount,
                currency=account.currency,
                status=TransactionStatus.COMPLETED,
                memo=f"Deposit Confirmed ({deposit.type.value.capitalize()})"
            )
            db.add(transaction)

        await db.commit()
        await db.refresh(deposit)

        # 4. Trigger user notification and Ably events
        try:
            # Publish balance update if confirmed
            if status == DepositStatus.CONFIRMED:
                await ably_service.publish_balance_update(
                    user_id=str(deposit.user_id),
                    balance=float(account.balance),
                    currency=account.currency.value
                )

            # Create in-app notification
            from app.models.notification import NotificationType
            
            notif_title = f"Deposit {status.value.capitalize()}"
            notif_msg = f"Your {deposit.type.value} deposit of {account.currency.value} {deposit.amount:.2f} was {status.value}"
            if admin_notes:
                notif_msg += f". Admin Notes: {admin_notes}"
                
            await notification_service.create_notification(
                db,
                user_id=deposit.user_id,
                type=NotificationType.DEPOSIT,
                title=notif_title,
                message=notif_msg
            )
        except Exception as e:
            logger.error(f"Post-review notifications/updates failed: {str(e)}")

        return deposit
