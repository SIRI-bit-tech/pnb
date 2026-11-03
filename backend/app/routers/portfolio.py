from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.user import User, Account, CurrencyType
from app.models.holding import Holding
from app.middleware.auth import get_current_user
from app.services.ably_service import ably_service
from app.services.stock_service import stock_service
from app.services.stock_details_service import stock_details_service
from app.schemas.portfolio import TradeRequest, TransferRequest, PermissionRequest
from app.services.portfolio_business_service import process_portfolio_transfer, process_portfolio_trade
from app.services.portfolio_email_service import (
    send_trade_confirmation_email,
    send_realized_gain_loss_email,
    send_portfolio_transfer_email
)

router = APIRouter(prefix="/portfolio", tags=["Investment Portfolio"])

@router.get("/stats")
async def get_portfolio_stats(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    account = (await db.execute(select(Account).filter(Account.user_id == current_user.id))).scalars().first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    holdings = (await db.execute(select(Holding).filter(Holding.user_id == current_user.id))).scalars().all()
    
    stocks_data = {s["ticker"]: s for s in await stock_service.get_stocks()}
    holdings_value = 0.0
    total_gain_loss = 0.0

    for h in holdings:
        live = stocks_data.get(h.ticker)
        if live:
            current_price = live["price"]
            val = current_price * float(h.shares)
            holdings_value += val
            cost = float(h.avg_cost) * float(h.shares)
            if h.type == "long":
                total_gain_loss += (val - cost)
            else:
                total_gain_loss += (cost - val)
                
    return {
        "investment_balance": float(account.investment_balance),
        "holdings_value": holdings_value,
        "total_portfolio_value": float(account.investment_balance) + holdings_value,
        "total_gain_loss": total_gain_loss,
        "margin_enabled": account.margin_enabled,
        "short_enabled": account.short_enabled,
        "checking_balance": float(account.checking_balance),
        "savings_balance": float(account.savings_balance),
        "currency": account.currency.value if hasattr(account.currency, "value") else str(account.currency)
    }

@router.get("/holdings")
async def get_portfolio_holdings(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    holdings = (await db.execute(select(Holding).filter(Holding.user_id == current_user.id))).scalars().all()
    stocks_data = {s["ticker"]: s for s in await stock_service.get_stocks()}
    results = []
    
    for h in holdings:
        live = stocks_data.get(h.ticker)
        current_price = live["price"] if live else float(h.avg_cost)
        change = live["change"] if live else 0.0
        val = current_price * float(h.shares)
        cost = float(h.avg_cost) * float(h.shares)
        gain_loss = (val - cost) if h.type == "long" else (cost - val)
        results.append({
            "id": h.id,
            "ticker": h.ticker,
            "name": live["name"] if live else h.ticker,
            "shares": h.shares,
            "avg_cost": float(h.avg_cost),
            "current_price": current_price,
            "value": val,
            "gain_loss": gain_loss,
            "gain_loss_percent": (gain_loss / cost * 100) if cost > 0 else 0.0,
            "change": change,
            "type": h.type
        })
    return results

@router.post("/permissions")
async def update_permissions(data: PermissionRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    account = (await db.execute(select(Account).filter(Account.user_id == current_user.id))).scalars().first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.margin_enabled = data.margin_enabled
    account.short_enabled = data.short_enabled
    await db.commit()
    return {"status": "success"}

@router.post("/transfer")
async def transfer_funds(
    data: TransferRequest, 
    background_tasks: BackgroundTasks, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    account = await process_portfolio_transfer(db, current_user, data)
    await db.commit()
    await ably_service.publish_balance_update(str(current_user.id), float(account.balance), account.currency.value)
    
    symbol = "£" if account.currency == CurrencyType.GBP else "$"
    background_tasks.add_task(
        send_portfolio_transfer_email,
        email=current_user.email,
        full_name=current_user.full_name,
        amount=float(data.amount),
        tx_type="top_up" if data.type in ["top_up", "deposit"] else "withdraw",
        source_account=data.source_account,
        symbol=symbol
    )
    return {
        "status": "success", 
        "investment_balance": float(account.investment_balance), 
        "checking_balance": float(account.checking_balance), 
        "savings_balance": float(account.savings_balance)
    }

@router.post("/trade")
async def execute_trade(
    data: TradeRequest, 
    background_tasks: BackgroundTasks, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    account, cost, realized_gain_loss, old_avg_cost = await process_portfolio_trade(db, current_user, data)
    await db.commit()
    await ably_service.publish_balance_update(str(current_user.id), float(account.balance), account.currency.value)
    
    symbol = "£" if account.currency == CurrencyType.GBP else "$"
    
    if realized_gain_loss is not None and old_avg_cost is not None:
        background_tasks.add_task(
            send_realized_gain_loss_email,
            email=current_user.email,
            full_name=current_user.full_name,
            ticker=data.ticker,
            shares=data.shares,
            open_price=old_avg_cost,
            close_price=float(data.price),
            gain_loss=realized_gain_loss,
            symbol=symbol
        )
    else:
        background_tasks.add_task(
            send_trade_confirmation_email,
            email=current_user.email,
            full_name=current_user.full_name,
            ticker=data.ticker,
            action=data.action,
            shares=data.shares,
            price=float(data.price),
            total_cost=float(cost),
            symbol=symbol
        )
    return {"status": "success"}

@router.get("/stocks")
async def get_stocks_endpoint(
    page: int = 1,
    page_size: int = 10,
    search: str = "",
    current_user: User = Depends(get_current_user)
):
    all_stocks = await stock_service.get_stocks()
    if search:
        search_lower = search.lower()
        all_stocks = [s for s in all_stocks if search_lower in s["ticker"].lower() or search_lower in s["name"].lower()]
    
    total = len(all_stocks)
    start = (page - 1) * page_size
    end = start + page_size
    return {"stocks": all_stocks[start:end], "total": total}

@router.get("/stocks/{ticker}/details")
async def get_stock_details_endpoint(ticker: str, current_user: User = Depends(get_current_user)):
    return await stock_details_service.get_details(ticker.upper())
