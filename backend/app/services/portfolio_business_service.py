from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from app.models.user import User, Account
from app.models.holding import Holding
from app.models.transaction import Transaction, TransactionType, TransactionStatus

async def process_portfolio_transfer(db: AsyncSession, current_user: User, data) -> Account:
    account = (await db.execute(select(Account).filter(Account.user_id == current_user.id))).scalars().first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    is_top_up = data.type in ["top_up", "deposit"]
    if is_top_up:
        if data.source_account == "checking":
            if account.checking_balance < data.amount:
                raise HTTPException(status_code=400, detail="Insufficient checking balance")
            account.checking_balance -= data.amount
        else:
            if account.savings_balance < data.amount:
                raise HTTPException(status_code=400, detail="Insufficient savings balance")
            account.savings_balance -= data.amount
        account.investment_balance += data.amount
    else:
        if account.investment_balance < data.amount:
            raise HTTPException(status_code=400, detail="Insufficient portfolio cash")
        account.investment_balance -= data.amount
        if data.source_account == "checking":
            account.checking_balance += data.amount
        else:
            account.savings_balance += data.amount
            
    account.balance = account.checking_balance + account.savings_balance + account.credit_balance
    
    tx = Transaction(
        from_account_id=account.id if not is_top_up else None,
        to_account_id=account.id if is_top_up else None,
        type=TransactionType.P2P,
        amount=data.amount,
        currency=account.currency,
        status=TransactionStatus.COMPLETED,
        memo=f"Portfolio {'Top-up' if is_top_up else 'Withdrawal'} via {data.source_account}"
    )
    db.add(tx)
    return account

async def process_portfolio_trade(db: AsyncSession, current_user: User, data):
    account = (await db.execute(select(Account).filter(Account.user_id == current_user.id))).scalars().first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    cost = data.price * data.shares
    holding_type = "long" if data.action in ["buy", "sell"] else "short"
    holding = (await db.execute(select(Holding).filter(
        Holding.user_id == current_user.id, 
        Holding.ticker == data.ticker, 
        Holding.type == holding_type
    ))).scalars().first()
    
    realized_gain_loss = None
    old_avg_cost = None

    if data.action == "buy":
        power = account.investment_balance * 2 if (data.use_margin and account.margin_enabled) else account.investment_balance
        if cost > power:
            raise HTTPException(status_code=400, detail="Insufficient buying power")
        account.investment_balance -= cost
        if holding:
            holding.avg_cost = ((holding.shares * holding.avg_cost) + cost) / (holding.shares + data.shares)
            holding.shares += data.shares
        else:
            db.add(Holding(user_id=current_user.id, ticker=data.ticker, shares=data.shares, avg_cost=data.price, type="long"))
            
    elif data.action == "sell":
        if not holding or holding.shares < data.shares:
            raise HTTPException(status_code=400, detail="Insufficient shares owned")
        old_avg_cost = float(holding.avg_cost)
        realized_gain_loss = float((data.price - holding.avg_cost) * data.shares)
        account.investment_balance += cost
        holding.shares -= data.shares
        if holding.shares == 0:
            await db.delete(holding)
            
    elif data.action == "short":
        if not account.short_enabled:
            raise HTTPException(status_code=400, detail="Short selling not enabled")
        if account.investment_balance < cost * Decimal("0.5"):
            raise HTTPException(status_code=400, detail="Insufficient collateral")
        account.investment_balance += cost
        if holding:
            holding.avg_cost = ((holding.shares * holding.avg_cost) + cost) / (holding.shares + data.shares)
            holding.shares += data.shares
        else:
            db.add(Holding(user_id=current_user.id, ticker=data.ticker, shares=data.shares, avg_cost=data.price, type="short"))
            
    elif data.action == "cover":
        if not holding or holding.shares < data.shares:
            raise HTTPException(status_code=400, detail="Insufficient short position to cover")
        if account.investment_balance < cost:
            raise HTTPException(status_code=400, detail="Insufficient portfolio cash to cover")
        old_avg_cost = float(holding.avg_cost)
        realized_gain_loss = float((holding.avg_cost - data.price) * data.shares)
        account.investment_balance -= cost
        holding.shares -= data.shares
        if holding.shares == 0:
            await db.delete(holding)
            
    account.balance = account.checking_balance + account.savings_balance + account.credit_balance
    return account, cost, realized_gain_loss, old_avg_cost
