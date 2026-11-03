from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, desc, func
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.utils.bank_directory import check_rate_limit, simulate_network_latency, get_banks_by_country

from app.database import get_db
from app.models.user import User, Account, CountryType
from app.models.transaction import Transaction, TransactionStatus
from app.schemas.transfer import (
    P2PTransferRequest,
    ExternalTransferRequest,
    InternationalTransferRequest,
    RoutingVerifyResponse,
    TransferResponse,
    TransactionListResponse,
    TransactionDetail
)
from app.services.transfer_service import TransferService
from app.middleware.auth import get_current_user
from app.utils.validators import validate_aba_routing, get_bank_name_by_routing, lookup_canadian_bank

router = APIRouter(prefix="/transfers", tags=["Transfers & Payments"])

@router.post("/send-otp")
async def send_transfer_otp(
    current_user: User = Depends(get_current_user)
):
    """
    Sends a 4-digit transfer authorization code to the authenticated user's email address.
    Blocks if the account is on Post-No-Debit (PND) restriction.
    """
    if current_user.account and current_user.account.is_frozen:
        reason = current_user.account.freeze_reason or "Your account has a temporary security hold. Outgoing transfers and withdrawals are paused pending verification."
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"FROZEN:{reason}"
        )

    from app.services.auth_service import AuthService
    try:
        await AuthService.send_otp(current_user.email, "email", digits=4, purpose="transfer")
        return {"message": "A 4-digit transfer authorization code has been sent to your registered email address."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send transfer authorization code: {str(e)}"
        )

@router.post("/p2p", response_model=TransferResponse)
async def p2p_transfer(
    data: P2PTransferRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Sends money to another user by their username. Updates balances atomically.
    """
    try:
        transaction = await TransferService.initiate_p2p_transfer(
            db=db,
            sender_user=current_user,
            recipient_username=data.recipient_username,
            amount=data.amount,
            pin=data.pin,
            memo=data.memo
        )
        return transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transfer processing failed: {str(e)}"
        )

@router.get("/history", response_model=TransactionListResponse)
async def get_history(
    page: int = 1,
    page_size: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves the current user's transaction history, including counterparty details.
    """
    if page < 1:
        page = 1
    offset = (page - 1) * page_size

    account_id = current_user.account.id

    # Get total count of transactions
    count_query = await db.execute(
        select(func.count(Transaction.id))
        .filter(
            or_(
                Transaction.from_account_id == account_id,
                Transaction.to_account_id == account_id
            )
        )
    )
    total_count = count_query.scalar() or 0

    # Get paginated transactions list, eager loading the accounts and their owners
    tx_query = (
        select(Transaction)
        .filter(
            or_(
                Transaction.from_account_id == account_id,
                Transaction.to_account_id == account_id
            )
        )
        .options(
            selectinload(Transaction.from_account).selectinload(Account.user),
            selectinload(Transaction.to_account).selectinload(Account.user)
        )
        .order_by(desc(Transaction.created_at))
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(tx_query)
    transactions = result.scalars().all()

    tx_details = []
    for tx in transactions:
      sender_username = None
      sender_full_name = None
      recipient_username = None
      recipient_full_name = None
      
      if tx.from_account and tx.from_account.user:
          sender_username = tx.from_account.user.username
          sender_full_name = tx.from_account.user.full_name
      if tx.to_account and tx.to_account.user:
          recipient_username = tx.to_account.user.username
          recipient_full_name = tx.to_account.user.full_name

      direction = "credit" if tx.to_account_id == account_id else "debit"
      stat_str = tx.status.value if hasattr(tx.status, "value") else str(tx.status or "completed")
      type_str = tx.type.value if hasattr(tx.type, "value") else str(tx.type or "ach")
      curr_str = tx.currency.value if hasattr(tx.currency, "value") else str(tx.currency or "USD")

      tx_details.append(
          TransactionDetail(
              id=tx.id,
              type=type_str.lower(),
              direction=direction,
              amount=tx.amount,
              currency=curr_str.upper(),
              status=stat_str.lower(),
              memo=tx.memo,
              created_at=tx.created_at,
              sender_username=sender_username,
              sender_full_name=sender_full_name,
              recipient_username=recipient_username,
              recipient_full_name=recipient_full_name,
              external_bank_name=tx.external_bank_name,
              external_account_number=tx.external_account_number,
              external_account_name=tx.external_account_name,
              fee=tx.fee
          )
      )

    return TransactionListResponse(
        transactions=tx_details,
        total_count=total_count,
        page=page,
        page_size=page_size
    )

import os
import json
import logging

logger = logging.getLogger(__name__)

RESOURCES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "resources")
BRAINTREE_PATH = os.path.join(RESOURCES_DIR, "braintree_routing.json")

BRAINTREE_ROUTING_CACHE = None

def get_local_routing_bank(routing_number: str) -> Optional[str]:
    global BRAINTREE_ROUTING_CACHE
    if BRAINTREE_ROUTING_CACHE is None:
        if os.path.exists(BRAINTREE_PATH):
            try:
                with open(BRAINTREE_PATH, "r", encoding="utf-8") as f:
                    BRAINTREE_ROUTING_CACHE = json.load(f)
            except Exception as e:
                logger.error(f"Failed to read local routing database: {e}")
                BRAINTREE_ROUTING_CACHE = {}
        else:
            BRAINTREE_ROUTING_CACHE = {}
    return BRAINTREE_ROUTING_CACHE.get(routing_number)

@router.get("/verify-routing", response_model=RoutingVerifyResponse)
async def verify_routing(
    routing_number: str,
    current_user: User = Depends(get_current_user)
):
    """
    Validates a US/Canada routing transit number format/checksum and returns the associated bank name.
    Includes rate-limiting, network latency simulation, and offline local bank lookup.
    """
    # 1. Rate Limit Check (6 requests per 10 seconds)
    check_rate_limit(f"verify_routing_{current_user.id}")
    
    # 2. Simulate Network Latency
    await simulate_network_latency()
    
    # 3. Country-Specific Validation
    if current_user.country == CountryType.US:
        if not validate_aba_routing(routing_number):
            return RoutingVerifyResponse(valid=False, error="Invalid routing number checksum")
            
        # Try Live RapidAPI US Bank Routing Lookup first
        from app.config import get_settings
        settings = get_settings()
        if settings.RAPIDAPI_KEY:
            try:
                import httpx
                host = "iban-swift-validator-and-routing-lookup.p.rapidapi.com"
                url = f"https://{host}/routing?number={routing_number}"
                headers = {
                    "x-rapidapi-key": settings.RAPIDAPI_KEY,
                    "x-rapidapi-host": host
                }
                async with httpx.AsyncClient() as client:
                    resp = await client.get(url, headers=headers, timeout=5.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        if data.get("valid"):
                            bank_name = data.get("ach", {}).get("Name") or data.get("wire", {}).get("Name")
                            if bank_name:
                                return RoutingVerifyResponse(valid=True, bank_name=bank_name.title())
            except Exception as e:
                logger.error(f"RapidAPI routing lookup failed: {e}")
                
        # Try local rich routing database (loaded offline)
        try:
            bank_name = get_local_routing_bank(routing_number)
            if bank_name:
                return RoutingVerifyResponse(valid=True, bank_name=bank_name.title())
        except Exception as e:
            logger.error(f"Error checking local routing database: {e}")
            
        # Fallback to local major registry as last resort
        try:
            bank_name = get_bank_name_by_routing(routing_number)
            return RoutingVerifyResponse(valid=True, bank_name=bank_name)
        except Exception:
            return RoutingVerifyResponse(valid=False, error="Could not verify routing number or find associated bank")
                
    elif current_user.country == CountryType.CA:
        bank_name = lookup_canadian_bank(routing_number)
        if bank_name:
            return RoutingVerifyResponse(valid=True, bank_name=bank_name)
        else:
            return RoutingVerifyResponse(valid=False, error="Canadian institution/transit number not found")
            
    else:
        return RoutingVerifyResponse(valid=False, error=f"Unsupported country registry: {current_user.country}")

@router.post("/external", response_model=TransferResponse)
async def external_transfer(
    data: ExternalTransferRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Initiates an external bank transfer (ACH or Wire). Charges transaction fee and simulates drop times.
    """
    try:
        transaction = await TransferService.initiate_external_transfer(
            db=db,
            sender_user=current_user,
            transfer_type=data.type,
            routing_number=data.routing_number,
            account_number=data.account_number,
            bank_name=data.bank_name,
            account_name=data.account_name,
            amount=data.amount,
            pin=data.pin,
            memo=data.memo
        )
        return transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"External transfer initiation failed: {str(e)}"
        )

@router.post("/international", response_model=TransferResponse)
async def international_transfer(
    data: InternationalTransferRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Initiates an international SWIFT/BIC wire transfer. Charges $35.00 wire fee, records PENDING transaction.
    """
    try:
        transaction = await TransferService.initiate_international_transfer(
            db=db,
            sender_user=current_user,
            beneficiary_name=data.beneficiary_name,
            beneficiary_address=data.beneficiary_address,
            beneficiary_country=data.beneficiary_country,
            iban_or_account=data.iban_or_account,
            swift_bic=data.swift_bic,
            bank_name=data.bank_name,
            bank_city=data.bank_city,
            amount=data.amount,
            currency=data.currency or "USD",
            from_account_type=data.from_account_type or "checking",
            pin=data.pin,
            memo=data.memo
        )
        return transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"International transfer initiation failed: {str(e)}"
        )

@router.get("/suggest-banks", response_model=List[str])
async def suggest_banks(
    q: Optional[str] = "",
    current_user: User = Depends(get_current_user)
):
    """
    Returns auto-suggest bank names matching query filtered by user's registration country.
    Includes simulated network latency and rate-limiting.
    """
    try:
        check_rate_limit(str(current_user.id))
        await simulate_network_latency()
        return await get_banks_by_country(current_user.country, q)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch bank suggestions: {str(e)}"
        )

@router.get("/spending")
async def get_spending_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns live monthly spending analytics aggregated from completed debit transactions.
    """
    if not current_user.account:
        return {
            "total_spending": 0.0,
            "breakdown": {"Housing": 0.0, "Food": 0.0, "Transport": 0.0, "Other": 0.0},
            "percentages": {"Housing": 0.0, "Food": 0.0, "Transport": 0.0, "Other": 0.0}
        }
        
    from app.models.transaction import Transaction, TransactionStatus
    query = await db.execute(
        select(Transaction).filter(
            Transaction.from_account_id == current_user.account.id,
            Transaction.status == TransactionStatus.COMPLETED
        )
    )
    txs = query.scalars().all()
    
    breakdown = {"Housing": 0.0, "Food": 0.0, "Transport": 0.0, "Other": 0.0}
    total_spending = 0.0
    
    for tx in txs:
        amt = float(tx.amount)
        total_spending += amt
        
        # Categorize based on memo/external fields
        memo = (tx.memo or "").lower()
        ext_name = (tx.external_account_name or "").lower()
        bank = (tx.external_bank_name or "").lower()
        desc = f"{memo} {ext_name} {bank}"
        
        if any(k in desc for k in ["apartment", "rent", "housing", "mortgage", "conedison", "utilities"]):
            breakdown["Housing"] += amt
        elif any(k in desc for k in ["food", "groceries", "dining", "restaurant", "balthazar", "whole foods"]):
            breakdown["Food"] += amt
        elif any(k in desc for k in ["uber", "lyft", "rides", "transport", "transit", "taxi", "gas"]):
            breakdown["Transport"] += amt
        else:
            breakdown["Other"] += amt
            
    # Compute percentages
    percentages = {"Housing": 0.0, "Food": 0.0, "Transport": 0.0, "Other": 0.0}
    if total_spending > 0:
        for k in breakdown:
            percentages[k] = round((breakdown[k] / total_spending) * 100, 1)
            
    return {
        "total_spending": round(total_spending, 2),
        "breakdown": breakdown,
        "percentages": percentages
    }
