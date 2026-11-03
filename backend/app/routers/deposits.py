from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from decimal import Decimal
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.user import User
from app.models.deposit import DepositType, Deposit
from app.models.admin_config import AdminConfig
from app.schemas.deposit import DepositSubmitRequest, DepositResponse, DepositListResponse
from app.services.deposit_service import DepositService
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/deposits", tags=["Deposits"])

@router.post("/check", response_model=DepositResponse)
async def submit_check_deposit(
    amount: Decimal = Form(..., gt=Decimal("0.00")),
    front: UploadFile = File(...),
    back: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submits a check deposit with front and back images. Uploads to UploadThing.
    """
    # Validate file formats
    allowed_types = ["image/jpeg", "image/png", "image/jpg"]
    if front.content_type not in allowed_types or back.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check images must be JPG, JPEG or PNG files"
        )
        
    try:
        front_bytes = await front.read()
        back_bytes = await back.read()
        
        deposit = await DepositService.create_check_deposit(
            db=db,
            user=current_user,
            amount=amount,
            front_bytes=front_bytes,
            back_bytes=back_bytes
        )
        return deposit
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Check deposit submission failed: {str(e)}"
        )

@router.post("/cashapp", response_model=DepositResponse)
async def submit_cashapp_deposit(
    data: DepositSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Declares a CashApp transfer deposit to be reviewed by admin.
    """
    try:
        deposit = await DepositService.create_external_deposit(
            db=db,
            user=current_user,
            type=DepositType.CASHAPP,
            amount=data.amount,
            reference_id=data.reference_id
        )
        return deposit
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/paypal", response_model=DepositResponse)
async def submit_paypal_deposit(
    data: DepositSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Declares a PayPal transfer deposit to be reviewed by admin.
    """
    try:
        deposit = await DepositService.create_external_deposit(
            db=db,
            user=current_user,
            type=DepositType.PAYPAL,
            amount=data.amount,
            reference_id=data.reference_id
        )
        return deposit
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/config")
async def get_deposit_configuration(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves the CashApp Tag, CashApp QR URL, PayPal Details, and PayPal QR URL.
    """
    config_keys = ["cashapp_tag", "cashapp_qr_url", "paypal_email", "paypal_qr_url"]
    query = await db.execute(select(AdminConfig).filter(AdminConfig.key.in_(config_keys)))
    configs = query.scalars().all()
    
    config_map = {cfg.key: cfg.value for cfg in configs}
    return {
        "cashapp_tag": config_map.get("cashapp_tag", ""),
        "cashapp_qr_url": config_map.get("cashapp_qr_url", ""),
        "paypal_email": config_map.get("paypal_email", ""),
        "paypal_qr_url": config_map.get("paypal_qr_url", "")
    }

@router.get("/history", response_model=DepositListResponse)
async def get_deposit_history(
    page: int = 1,
    page_size: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves a list of deposit submissions for the current authenticated user.
    """
    try:
        deposits, total_count = await DepositService.get_user_deposits(
            db=db,
            user_id=current_user.id,
            page=page,
            page_size=page_size
        )
        return DepositListResponse(
            deposits=deposits,
            total_count=total_count
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch deposit history: {str(e)}"
        )
