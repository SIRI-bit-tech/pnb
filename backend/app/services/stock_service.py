import time
import httpx
import logging
import asyncio
from typing import List, Dict, Any, Optional
from app.config import get_settings

logger = logging.getLogger(__name__)

TICKERS = [
    "AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "GOOGL", "META", "NFLX", "AMD", "INTC",
    "COIN", "MSTR", "PYPL", "BABA", "TSM", "BTC/USD", "ETH/USD", "SOL/USD", "DOGE/USD", "ADA/USD"
]

COMPANY_NAMES = {
    "AAPL": "Apple Inc.",
    "TSLA": "Tesla Inc.",
    "NVDA": "NVIDIA Corp.",
    "MSFT": "Microsoft Corp.",
    "AMZN": "Amazon.com Inc.",
    "GOOGL": "Alphabet Inc.",
    "META": "Meta Platforms Inc.",
    "NFLX": "Netflix Inc.",
    "AMD": "Advanced Micro Devices",
    "INTC": "Intel Corp.",
    "COIN": "Coinbase Global Inc.",
    "MSTR": "MicroStrategy Inc.",
    "PYPL": "PayPal Holdings Inc.",
    "BABA": "Alibaba Group Holding",
    "TSM": "Taiwan Semiconductor",
    "BTC/USD": "Bitcoin",
    "ETH/USD": "Ethereum",
    "SOL/USD": "Solana",
    "DOGE/USD": "Dogecoin",
    "ADA/USD": "Cardano"
}

FINNHUB_SYMBOL_MAP = {
    "BTC/USD": "BINANCE:BTCUSDT",
    "ETH/USD": "BINANCE:ETHUSDT",
    "SOL/USD": "BINANCE:SOLUSDT",
    "DOGE/USD": "BINANCE:DOGEUSDT",
    "ADA/USD": "BINANCE:ADAUSDT",
}

class StockService:
    def __init__(self):
        self._cache: Optional[List[Dict[str, Any]]] = None
        self._last_fetched: float = 0.0
        self._cache_duration_seconds: float = 120.0  # 2 minute cache to respect rate limits
        self._candles_cache: Dict[str, List[float]] = {}
        self._candles_fetched: Dict[str, float] = {}
        self._candles_duration_seconds: float = 3600.0  # 1 hour cache for historical sparklines

    async def get_stocks(self) -> List[Dict[str, Any]]:
        """
        Retrieves real-time prices, changes, and 7-day sparklines using Finnhub.
        Applies a 2-minute cache for quotes and a 1-hour cache for daily candles.
        """
        now = time.time()
        if self._cache and (now - self._last_fetched) < self._cache_duration_seconds:
            return self._cache

        settings = get_settings()
        finnhub_key = settings.FINNHUB_API_KEY

        if not finnhub_key:
            raise RuntimeError("Finnhub API key is not configured.")

        try:
            data = await self._fetch_from_finnhub(finnhub_key)
            if not data:
                # If all individual tickers failed, raise an error to show Unavailable state
                raise RuntimeError("All asset fetches failed.")
            self._cache = data
            self._last_fetched = now
            return data
        except Exception as e:
            logger.error(f"Finnhub API fetch failed: {str(e)}")
            raise RuntimeError("Real-time stock and crypto data is currently unavailable.")

    async def _fetch_ticker_data(self, client: httpx.AsyncClient, ticker: str, api_key: str, now: float) -> Optional[Dict[str, Any]]:
        api_symbol = FINNHUB_SYMBOL_MAP.get(ticker, ticker)
        is_crypto = ticker in FINNHUB_SYMBOL_MAP
        end_time = int(now)
        start_time = end_time - (7 * 24 * 60 * 60)

        try:
            # 1. Fetch Quote
            quote_url = f"https://finnhub.io/api/v1/quote?symbol={api_symbol}&token={api_key}"
            quote_res = await client.get(quote_url)
            if quote_res.status_code != 200:
                raise RuntimeError(f"Quote failed with status {quote_res.status_code}")
            
            quote_data = quote_res.json()
            # If quote returns c == 0 (e.g. unsupported crypto on free plan), raise error to skip this asset
            if "c" not in quote_data or quote_data["c"] == 0:
                raise RuntimeError("Quote price is zero or missing (unsupported symbol)")

            price = float(quote_data["c"])
            change = float(quote_data.get("dp", 0.0))

            # 2. Fetch Candles (with 1-hour cache and graceful 403 fallback)
            sparkline = []
            if ticker in self._candles_cache and (now - self._candles_fetched.get(ticker, 0.0)) < self._candles_duration_seconds:
                sparkline = self._candles_cache[ticker]
            else:
                try:
                    if is_crypto:
                        candle_url = f"https://finnhub.io/api/v1/crypto/candle?symbol={api_symbol}&resolution=D&from={start_time}&to={end_time}&token={api_key}"
                    else:
                        candle_url = f"https://finnhub.io/api/v1/stock/candle?symbol={api_symbol}&resolution=D&from={start_time}&to={end_time}&token={api_key}"
                    
                    candle_res = await client.get(candle_url)
                    if candle_res.status_code == 200:
                        candle_data = candle_res.json()
                        if "c" in candle_data and isinstance(candle_data["c"], list):
                            sparkline = [float(val) for val in candle_data["c"]]
                    # Cache result (or empty on 403/other error) so we don't bombard blocked endpoints
                    self._candles_cache[ticker] = sparkline
                    self._candles_fetched[ticker] = now
                except Exception as e:
                    logger.warning(f"Failed to fetch candle for {ticker}: {e}")
                    self._candles_cache[ticker] = []
                    self._candles_fetched[ticker] = now

            if not sparkline:
                sparkline = [price - (price * change / 100.0), price]

            return {
                "ticker": ticker,
                "name": COMPANY_NAMES[ticker],
                "price": price,
                "change": change,
                "sparkline": sparkline
            }
        except Exception as e:
            logger.warning(f"Skipping ticker {ticker} due to fetch error: {str(e)}")
            return None

    async def _fetch_from_finnhub(self, api_key: str) -> List[Dict[str, Any]]:
        now = time.time()
        async with httpx.AsyncClient(timeout=10.0) as client:
            tasks = [self._fetch_ticker_data(client, ticker, api_key, now) for ticker in TICKERS]
            results = await asyncio.gather(*tasks)
            # Filter out any None values (skipped tickers due to free-tier/unsupported symbol errors)
            return [r for r in results if r is not None]

stock_service = StockService()
