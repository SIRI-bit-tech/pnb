from pydantic import BaseModel, Field
from decimal import Decimal

class TradeRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=10)
    shares: int = Field(..., gt=0)
    action: str = Field(..., pattern="^(buy|sell|short|cover)$")
    price: Decimal = Field(..., gt=0)
    use_margin: bool = False

class TransferRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    type: str = Field(..., pattern="^(top_up|deposit|withdraw)$")
    source_account: str = Field(..., pattern="^(checking|savings)$")

class PermissionRequest(BaseModel):
    margin_enabled: bool
    short_enabled: bool
