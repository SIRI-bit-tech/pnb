import time
import httpx
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.config import get_settings
from app.services.stock_service import FINNHUB_SYMBOL_MAP

logger = logging.getLogger(__name__)

class StockDetailsService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cache_times: Dict[str, float] = {}
        self._cache_duration_seconds: float = 300.0  # 5 minutes cache

    async def get_details(self, ticker: str) -> Dict[str, Any]:
        """
        Fetches news, metrics, recommendations, and peers for a ticker using Finnhub.
        Caches results for 5 minutes. Returns empty details if Finnhub fails.
        """
        now = time.time()
        if ticker in self._cache and (now - self._cache_times.get(ticker, 0.0)) < self._cache_duration_seconds:
            return self._cache[ticker]

        settings = get_settings()
        finnhub_key = settings.FINNHUB_API_KEY

        if finnhub_key:
            try:
                data = await self._fetch_from_finnhub(ticker, finnhub_key)
                self._cache[ticker] = data
                self._cache_times[ticker] = now
                return data
            except Exception as e:
                logger.warning(f"Finnhub details failed for {ticker}: {str(e)}")

        return self._get_empty_details()

    async def _fetch_from_finnhub(self, ticker: str, api_key: str) -> Dict[str, Any]:
        api_symbol = FINNHUB_SYMBOL_MAP.get(ticker, ticker)
        is_crypto = ticker in FINNHUB_SYMBOL_MAP

        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

        async with httpx.AsyncClient(timeout=10.0) as client:
            # 1. Fetch News (Stocks only)
            news_list = []
            if not is_crypto:
                try:
                    news_url = f"https://finnhub.io/api/v1/company-news?symbol={api_symbol}&from={start_date}&to={end_date}&token={api_key}"
                    res = await client.get(news_url)
                    if res.status_code == 200:
                        for n in res.json()[:4]:
                            news_list.append({
                                "headline": n.get("headline", ""),
                                "summary": n.get("summary", ""),
                                "source": n.get("source", ""),
                                "url": n.get("url", ""),
                                "datetime": n.get("datetime", 0)
                            })
                except Exception as e:
                    logger.warning(f"Failed to fetch Finnhub news for {ticker}: {e}")

            # 2. Fetch Metrics
            metrics = {"market_cap": 0.0, "high_52": 0.0, "low_52": 0.0, "pe_ratio": 0.0, "dividend_yield": 0.0}
            try:
                metric_url = f"https://finnhub.io/api/v1/stock/metric?symbol={api_symbol}&metric=all&token={api_key}"
                res = await client.get(metric_url)
                if res.status_code == 200:
                    m = res.json().get("metric", {})
                    metrics = {
                        "market_cap": float(m.get("marketCapitalization", 0.0)),
                        "high_52": float(m.get("52WeekHigh", 0.0)),
                        "low_52": float(m.get("52WeekLow", 0.0)),
                        "pe_ratio": float(m.get("peNormalized", 0.0) or m.get("peBasicExclExtraPig", 0.0) or 0.0),
                        "dividend_yield": float(m.get("dividendYieldIndicatedAnnual", 0.0) or 0.0)
                    }
            except Exception as e:
                logger.warning(f"Failed to fetch Finnhub metrics for {ticker}: {e}")

            # 3. Fetch Recommendations (Stocks only)
            recommendation = {"buy": 0, "hold": 0, "sell": 0, "strong_buy": 0}
            if not is_crypto:
                try:
                    rec_url = f"https://finnhub.io/api/v1/stock/recommendation?symbol={api_symbol}&token={api_key}"
                    res = await client.get(rec_url)
                    if res.status_code == 200 and len(res.json()) > 0:
                        rec = res.json()[0]
                        recommendation = {
                            "buy": int(rec.get("buy", 0)),
                            "hold": int(rec.get("hold", 0)),
                            "sell": int(rec.get("sell", 0)),
                            "strong_buy": int(rec.get("strongBuy", 0))
                        }
                except Exception as e:
                    logger.warning(f"Failed to fetch Finnhub recommendation for {ticker}: {e}")

            # 4. Fetch Peers (Stocks only)
            peers = []
            if not is_crypto:
                try:
                    peers_url = f"https://finnhub.io/api/v1/stock/peers?symbol={api_symbol}&token={api_key}"
                    res = await client.get(peers_url)
                    if res.status_code == 200:
                        peers = [p for p in res.json() if p != ticker][:4]
                except Exception as e:
                    logger.warning(f"Failed to fetch Finnhub peers for {ticker}: {e}")

            return {
                "news": news_list,
                "metrics": metrics,
                "recommendation": recommendation,
                "peers": peers
            }

    def _get_empty_details(self) -> Dict[str, Any]:
        return {
            "news": [],
            "metrics": {"market_cap": 0.0, "high_52": 0.0, "low_52": 0.0, "pe_ratio": 0.0, "dividend_yield": 0.0},
            "recommendation": {"buy": 0, "hold": 0, "sell": 0, "strong_buy": 0},
            "peers": []
        }

stock_details_service = StockDetailsService()
