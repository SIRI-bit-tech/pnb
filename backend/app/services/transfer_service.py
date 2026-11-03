import logging
from decimal import Decimal
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from app.models.user import User, Account, CurrencyType
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.services.ably_service import ably_service
from app.services.notification_service import notification_service
from app.utils.security import verify_password

logger = logging.getLogger(__name__)

# Basic conversion rates for multi-currency transfers
EXCHANGE_RATES = {
    (CurrencyType.USD, CurrencyType.GBP): Decimal("0.78"),
    (CurrencyType.USD, CurrencyType.CAD): Decimal("1.36"),
    (CurrencyType.GBP, CurrencyType.USD): Decimal("1.28"),
    (CurrencyType.GBP, CurrencyType.CAD): Decimal("1.74"),
    (CurrencyType.CAD, CurrencyType.USD): Decimal("0.74"),
    (CurrencyType.CAD, CurrencyType.GBP): Decimal("0.57"),
}

def convert_currency(amount: Decimal, from_curr: CurrencyType, to_curr: CurrencyType) -> Decimal:
    if from_curr == to_curr:
        return amount
    rate = EXCHANGE_RATES.get((from_curr, to_curr))
    if not rate:
        logger.error(f"No exchange rate found for {from_curr.value} to {to_curr.value}. Using 1:1 fallback.")
        return amount
    return (amount * rate).quantize(Decimal("0.0001"))

class TransferService:
    @staticmethod
    async def initiate_p2p_transfer(
        db: AsyncSession,
        sender_user: User,
        recipient_username: str,
        amount: Decimal,
        pin: str,
        memo: Optional[str] = None
    ) -> Transaction:
        """
        Processes P2P transfer between two users with row-level locking (with_for_update)
        and atomic balance updates. Supports real-time Ably notifications and currency conversion.
        """
        # Verify transaction PIN
        # Verify 4-digit transfer authorization OTP code
        from app.services.auth_service import AuthService
        is_otp_valid = await AuthService.verify_otp(sender_user.email, str(pin).strip(), "email")
        if not is_otp_valid:
            if sender_user.transaction_pin_hash and verify_password(str(pin).strip(), sender_user.transaction_pin_salt, sender_user.transaction_pin_hash):
                pass
            else:
                raise ValueError("Invalid or expired 4-digit transfer authorization code.")

        # 1. Look up recipient user (case-insensitive)
        clean_recipient = recipient_username.strip().lower()
        recipient_query = await db.execute(
            select(User).filter(func.lower(User.username) == clean_recipient, User.is_active == True)
        )
        recipient_user = recipient_query.scalars().first()
        if not recipient_user:
            raise ValueError(f"Recipient user '{recipient_username}' not found or inactive")

        if sender_user.id == recipient_user.id:
            raise ValueError("You cannot send money to yourself")

        # 2. Acquire lock on both accounts (lock sender first, then recipient, to prevent deadlock)
        account_ids = sorted([sender_user.account.id, recipient_user.account.id])
        
        locked_accounts = {}
        for acc_id in account_ids:
            acc_query = await db.execute(
                select(Account).filter(Account.id == acc_id).with_for_update()
            )
            locked_accounts[acc_id] = acc_query.scalars().first()

        sender_account = locked_accounts[sender_user.account.id]
        recipient_account = locked_accounts[recipient_user.account.id]

        if not sender_account or not recipient_account:
            raise ValueError("Account error. Failed to retrieve banking profiles.")

        # Post-No-Debit (PND) restriction check
        if sender_account.is_frozen:
            raise ValueError(f"FROZEN:{sender_account.freeze_reason or 'We detected an unrecognized sign-in attempt from an unknown device and unfamiliar location. A temporary security hold has been placed to protect your account from unauthorized activity.'}")

        # 3. Check checking balance
        if sender_account.checking_balance < amount:
            raise ValueError("Insufficient checking balance to complete this transfer")

        # 4. Perform currency conversion if accounts differ
        sender_currency = sender_account.currency
        recipient_currency = recipient_account.currency
        
        recipient_amount = convert_currency(amount, sender_currency, recipient_currency)

        # 5. Modify checking balances atomically
        sender_account.checking_balance -= amount
        recipient_account.checking_balance += recipient_amount

        # Update total balances
        sender_account.balance = sender_account.checking_balance + sender_account.savings_balance + sender_account.credit_balance
        recipient_account.balance = recipient_account.checking_balance + recipient_account.savings_balance + recipient_account.credit_balance

        # 6. Record Transaction
        transaction = Transaction(
            from_account_id=sender_account.id,
            to_account_id=recipient_account.id,
            type=TransactionType.P2P,
            amount=amount,
            currency=sender_currency,
            status=TransactionStatus.COMPLETED,
            memo=memo
        )
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)

        # 7. Trigger Ably real-time events and notifications
        try:
            # Publish balance updates
            await ably_service.publish_balance_update(
                user_id=str(sender_user.id),
                balance=float(sender_account.balance),
                currency=sender_currency.value
            )
            await ably_service.publish_balance_update(
                user_id=str(recipient_user.id),
                balance=float(recipient_account.balance),
                currency=recipient_currency.value
            )

            # Create in-app notifications
            from app.models.notification import NotificationType
            
            sender_title = "Money Sent"
            sender_msg = f"Successfully sent {sender_currency.value} {amount:.2f} to {recipient_user.full_name}"
            await notification_service.create_notification(
                db, 
                user_id=sender_user.id, 
                type=NotificationType.TRANSFER, 
                title=sender_title, 
                message=sender_msg
            )

            recipient_title = "Money Received"
            recipient_msg = f"Received {recipient_currency.value} {recipient_amount:.2f} from {sender_user.full_name}"
            await notification_service.create_notification(
                db, 
                user_id=recipient_user.id, 
                type=NotificationType.TRANSFER, 
                title=recipient_title, 
                message=recipient_msg
            )
        except Exception as e:
            logger.error(f"Post-transfer events failed: {str(e)}")

        return transaction

    @staticmethod
    async def initiate_external_transfer(
        db: AsyncSession,
        sender_user: User,
        transfer_type: str,
        routing_number: str,
        account_number: str,
        bank_name: str,
        account_name: str,
        amount: Decimal,
        pin: str,
        memo: Optional[str] = None
    ) -> Transaction:
        """
        Initiates an external ACH or Wire transfer. Checks PIN, balance, deducts amount + fee,
        and saves transaction in PENDING status. Supports Ably notifications.
        """
        # 1. Verify 4-digit transfer authorization OTP code
        from app.services.auth_service import AuthService
        is_otp_valid = await AuthService.verify_otp(sender_user.email, str(pin).strip(), "email")
        if not is_otp_valid:
            if sender_user.transaction_pin_hash and verify_password(str(pin).strip(), sender_user.transaction_pin_salt, sender_user.transaction_pin_hash):
                pass
            else:
                raise ValueError("Invalid or expired 4-digit transfer authorization code.")

        # 2. Determine fee and transaction type
        transfer_type_lower = transfer_type.lower()
        if transfer_type_lower == "ach":
            fee = Decimal("1.0000")
            tx_type = TransactionType.ACH
        elif transfer_type_lower == "wire":
            fee = Decimal("25.0000")
            tx_type = TransactionType.WIRE
        else:
            raise ValueError(f"Unsupported transfer type: {transfer_type}")

        # 3. Lock sender account
        acc_query = await db.execute(
            select(Account).filter(Account.id == sender_user.account.id).with_for_update()
        )
        sender_account = acc_query.scalars().first()
        if not sender_account:
            raise ValueError("Sender banking profile not found")

        # Post-No-Debit (PND) restriction check
        if sender_account.is_frozen:
            raise ValueError(f"FROZEN:{sender_account.freeze_reason or 'We detected an unrecognized sign-in attempt from an unknown device and unfamiliar location. A temporary security hold has been placed to protect your account from unauthorized activity.'}")

        # 4. Check checking balance
        total_deduction = amount + fee
        if sender_account.checking_balance < total_deduction:
            raise ValueError(f"Insufficient checking balance. External {transfer_type_lower.upper()} requires {amount} plus a {fee} transfer fee (Total: {total_deduction}).")

        # 5. Deduct checking balance
        sender_account.checking_balance -= total_deduction
        
        # Update total balance
        sender_account.balance = sender_account.checking_balance + sender_account.savings_balance + sender_account.credit_balance

        # 6. Record transaction in PENDING state
        transaction = Transaction(
            from_account_id=sender_account.id,
            to_account_id=None,
            type=tx_type,
            amount=amount,
            currency=sender_account.currency,
            status=TransactionStatus.PENDING,
            routing_number=routing_number,
            external_bank_name=bank_name,
            external_account_number=account_number,
            external_account_name=account_name,
            fee=fee,
            memo=memo
        )
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)

        # 7. Trigger Ably real-time balance update and notification
        try:
            await ably_service.publish_balance_update(
                user_id=str(sender_user.id),
                balance=float(sender_account.balance),
                currency=sender_account.currency.value
            )

            from app.models.notification import NotificationType
            title = f"{transfer_type_lower.upper()} Transfer Initiated"
            msg = f"Your {transfer_type_lower.upper()} transfer of {sender_account.currency.value} {amount:.2f} to {bank_name} has been initiated (Fee: {fee:.2f})."
            await notification_service.create_notification(
                db,
                user_id=sender_user.id,
                type=NotificationType.TRANSFER,
                title=title,
                message=msg
            )
        except Exception as e:
            logger.error(f"Post external-transfer events failed: {str(e)}")

        return transaction

    @staticmethod
    async def initiate_international_transfer(
        db: AsyncSession,
        sender_user: User,
        beneficiary_name: str,
        beneficiary_address: Optional[str],
        beneficiary_country: str,
        iban_or_account: str,
        swift_bic: str,
        bank_name: str,
        bank_city: Optional[str],
        amount: Decimal,
        currency: str,
        from_account_type: str,
        pin: str,
        memo: Optional[str] = None
    ) -> Transaction:
        """
        Initiates an international SWIFT/BIC wire transfer. Checks OTP/PIN, PND freeze, balance,
        deducts amount + $35.00 wire fee, and saves transaction in PENDING status.
        """
        # 1. Verify 4-digit transfer authorization OTP code
        from app.services.auth_service import AuthService
        is_otp_valid = await AuthService.verify_otp(sender_user.email, str(pin).strip(), "email")
        if not is_otp_valid:
            if sender_user.transaction_pin_hash and verify_password(str(pin).strip(), sender_user.transaction_pin_salt, sender_user.transaction_pin_hash):
                pass
            else:
                raise ValueError("Invalid or expired 4-digit transfer authorization code.")

        fee = Decimal("35.0000")
        tx_type = TransactionType.WIRE

        # 2. Lock sender account
        acc_query = await db.execute(
            select(Account).filter(Account.id == sender_user.account.id).with_for_update()
        )
        sender_account = acc_query.scalars().first()
        if not sender_account:
            raise ValueError("Sender banking profile not found")

        # Post-No-Debit (PND) restriction check
        if sender_account.is_frozen:
            raise ValueError(f"FROZEN:{sender_account.freeze_reason or 'We detected an unrecognized sign-in attempt from an unknown device and unfamiliar location. A temporary security hold has been placed to protect your account from unauthorized activity.'}")

        # 3. Check balance based on source account
        total_deduction = amount + fee
        is_savings = from_account_type.lower() == "savings"
        available_balance = sender_account.savings_balance if is_savings else sender_account.checking_balance
        account_label = "Savings" if is_savings else "Checking"

        if available_balance < total_deduction:
            raise ValueError(f"Insufficient {account_label} balance. International Wire requires {amount:.2f} plus a {fee:.2f} wire fee (Total: {total_deduction:.2f}). Available: {available_balance:.2f}.")

        # 4. Deduct balance
        if is_savings:
            sender_account.savings_balance -= total_deduction
        else:
            sender_account.checking_balance -= total_deduction

        sender_account.balance = sender_account.checking_balance + sender_account.savings_balance + sender_account.credit_balance

        # 5. Format destination details
        ext_bank = f"{bank_name} ({beneficiary_country})".strip()[:100]
        ext_acc_num = iban_or_account.strip().upper()[:50]
        ext_acc_name = beneficiary_name.strip()[:100]
        wire_memo = memo.strip() if memo and memo.strip() else f"SWIFT Wire to {beneficiary_name} ({beneficiary_country})"

        # 6. Record transaction in PENDING state
        transaction = Transaction(
            from_account_id=sender_account.id,
            to_account_id=None,
            type=tx_type,
            amount=amount,
            currency=sender_account.currency,
            status=TransactionStatus.PENDING,
            routing_number=swift_bic.strip().upper()[:50],
            external_bank_name=ext_bank,
            external_account_number=ext_acc_num,
            external_account_name=ext_acc_name,
            fee=fee,
            memo=wire_memo
        )
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)

        # 7. Trigger Ably real-time balance update and notification
        try:
            await ably_service.publish_balance_update(
                user_id=str(sender_user.id),
                balance=float(sender_account.balance),
                currency=sender_account.currency.value
            )

            from app.models.notification import NotificationType
            title = "International Wire Initiated"
            msg = f"Your international wire transfer of {sender_account.currency.value} {amount:.2f} to {beneficiary_name} ({bank_name} - SWIFT: {swift_bic.strip().upper()}) has been submitted for processing (Fee: ${fee:.2f})."
            await notification_service.create_notification(
                db,
                user_id=sender_user.id,
                type=NotificationType.TRANSFER,
                title=title,
                message=msg
            )
        except Exception as e:
            logger.error(f"Post international-transfer events failed: {str(e)}")

        return transaction

async def send_transfer_completed_email(
    email: str,
    full_name: str,
    tx_type: str,
    amount: Decimal,
    currency: str,
    bank_name: str,
    fee: Decimal
) -> bool:
    import httpx
    from app.config import get_settings
    settings = get_settings()
    if not settings.RESEND_API_KEY:
        logger.warning(f"Resend is not configured. Email skipped for {email}.")
        return False

    app_url = getattr(settings, "APP_URL", "https://prescottnational.com")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>External Transfer Confirmed - Prescott National Bank</title>
      <style>
        body {{ background-color: #04060c; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #0c0f19; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 48px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
        .logo {{ font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 1px; margin-bottom: 32px; text-align: center; }}
        .logo span {{ color: #1faa6e; font-weight: 500; }}
        h1 {{ font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #ffffff; text-align: center; }}
        p {{ font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }}
        .receipt-card {{ background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 24px; margin-bottom: 24px; }}
        .receipt-row {{ display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; }}
        .receipt-row:last-child {{ margin-bottom: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 12px; margin-top: 12px; }}
        .receipt-label {{ color: #94a3b8; }}
        .receipt-value {{ color: #ffffff; font-weight: bold; }}
        .cta-button {{ display: block; text-align: center; background-color: #ffffff; color: #000000; font-weight: bold; font-size: 14px; padding: 14px 24px; border-radius: 14px; text-decoration: none; margin: 32px 0 24px 0; }}
        .footer {{ font-size: 11px; color: #64748b; margin-top: 40px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 24px; line-height: 1.5; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">PRESCOTT <span>NATIONAL</span></div>
        <h1>Transfer Completed Successfully</h1>
        <p>Dear {full_name},</p>
        <p>Your external {tx_type.upper()} transfer has been fully processed and confirmed. Funds have been successfully delivered to the recipient bank.</p>
        
        <div class="receipt-card">
          <div class="receipt-row">
            <span class="receipt-label">Transfer Type</span>
            <span class="receipt-value">{tx_type.upper()}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Recipient Bank</span>
            <span class="receipt-value">{bank_name}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Amount Sent</span>
            <span class="receipt-value">{currency} {amount:.2f}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Transfer Fee</span>
            <span class="receipt-value">{currency} {fee:.2f}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Status</span>
            <span class="receipt-value" style="color: #16A34A;">COMPLETED</span>
          </div>
        </div>

        <a href="{app_url}/dashboard/transactions" class="cta-button">View Transaction History</a>
        
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
        "subject": f"External {tx_type.upper()} Transfer Confirmed — Prescott National Bank",
        "html": html_content
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post("https://api.resend.com/emails", json=payload, headers=headers)
            if resp.status_code >= 400:
                logger.error(f"Resend transfer email failed with status {resp.status_code}: {resp.text}")
                return False
            return True
    except Exception as e:
        logger.error(f"Failed to deliver transfer completion email via Resend: {str(e)}")
        return False

async def run_transaction_scheduler():
    import asyncio
    from app.database import AsyncSessionLocal
    from app.models.transaction import Transaction, TransactionStatus, TransactionType
    from app.models.user import User, Account
    from app.services.notification_service import notification_service
    
    logger.info("Starting external transaction scheduler background task...")
    while True:
        try:
            await asyncio.sleep(10)
            async with AsyncSessionLocal() as db:
                query = (
                    select(Transaction)
                    .filter(
                        Transaction.type.in_([TransactionType.ACH, TransactionType.WIRE]),
                        Transaction.status.in_([TransactionStatus.PENDING, TransactionStatus.PROCESSING])
                    )
                    .options(selectinload(Transaction.from_account).selectinload(Account.user))
                )
                result = await db.execute(query)
                transactions = result.scalars().all()
                
                now = datetime.now(timezone.utc)
                
                for tx in transactions:
                    tx_time = tx.created_at
                    if tx_time.tzinfo is None:
                        tx_time = tx_time.replace(tzinfo=timezone.utc)
                        
                    elapsed_seconds = (now - tx_time).total_seconds()
                    user = tx.from_account.user if (tx.from_account and tx.from_account.user) else None
                    if not user:
                        continue
                        
                    changed = False
                    email_to_send = False
                    
                    if tx.type == TransactionType.ACH:
                        if tx.status == TransactionStatus.PENDING and elapsed_seconds >= 120: # 2 minutes
                            tx.status = TransactionStatus.PROCESSING
                            changed = True
                            logger.info(f"ACH Tx {tx.id} automatically moved to PROCESSING after {elapsed_seconds:.1f}s")
                        elif tx.status == TransactionStatus.PROCESSING and elapsed_seconds >= 300: # 5 minutes total
                            tx.status = TransactionStatus.COMPLETED
                            changed = True
                            email_to_send = True
                            logger.info(f"ACH Tx {tx.id} automatically moved to COMPLETED after {elapsed_seconds:.1f}s")
                            
                    elif tx.type == TransactionType.WIRE:
                        if tx.status == TransactionStatus.PENDING and elapsed_seconds >= 10: # 10 seconds
                            tx.status = TransactionStatus.PROCESSING
                            changed = True
                            logger.info(f"WIRE Tx {tx.id} automatically moved to PROCESSING after {elapsed_seconds:.1f}s")
                        elif tx.status == TransactionStatus.PROCESSING and elapsed_seconds >= 30: # 30 seconds total
                            tx.status = TransactionStatus.COMPLETED
                            changed = True
                            email_to_send = True
                            logger.info(f"WIRE Tx {tx.id} automatically moved to COMPLETED after {elapsed_seconds:.1f}s")
                            
                    if changed:
                        db.add(tx)
                        await db.commit()
                        
                        try:
                            from app.models.notification import NotificationType
                            status_str = "is now being processed" if tx.status == TransactionStatus.PROCESSING else "has been completed"
                            title = f"Transfer {tx.status.value.capitalize()}"
                            msg = f"Your {tx.type.value.upper()} transfer of {tx.currency.value} {tx.amount:.2f} to {tx.external_bank_name} {status_str}."
                            await notification_service.create_notification(
                                db,
                                user_id=user.id,
                                type=NotificationType.TRANSFER,
                                title=title,
                                message=msg
                            )
                        except Exception as e:
                            logger.error(f"Failed to create background notification for tx {tx.id}: {e}")
                            
                        if email_to_send:
                            try:
                                await send_transfer_completed_email(
                                    email=user.email,
                                    full_name=user.full_name,
                                    tx_type=tx.type.value,
                                    amount=tx.amount,
                                    currency=tx.currency.value,
                                    bank_name=tx.external_bank_name,
                                    fee=tx.fee
                                )
                            except Exception as e:
                                logger.error(f"Failed to send background email for tx {tx.id}: {e}")
                                
        except asyncio.CancelledError:
            logger.info("Scheduler task cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in transaction scheduler loop: {e}")
