import asyncio
import random
import logging
import httpx
from datetime import datetime, timedelta
from typing import List
from fastapi import HTTPException, status
from app.models.user import CountryType

logger = logging.getLogger(__name__)

# Rate limit storage: user_id -> List[datetime]
RATE_LIMIT_STORE = {}

# Canadian Banks Registry (Payments Canada)
CA_BANKS_REGISTRY = [
    "Bank of Montreal (BMO)",
    "Bank of Nova Scotia (Scotiabank)",
    "Royal Bank of Canada (RBC)",
    "Toronto-Dominion Bank (TD)",
    "National Bank of Canada",
    "Canadian Imperial Bank of Commerce (CIBC)",
    "HSBC Bank Canada",
    "Canadian Western Bank",
    "Laurentian Bank of Canada",
    "First Nations Bank of Canada",
    "State Street Canada",
    "Mega International Commercial Bank Canada",
    "JPMorgan Chase Bank, N.A. (Canada)",
    "Industrial and Commercial Bank of China (Canada)",
    "State Bank of India (Canada)",
    "Tangerine Bank",
    "Shinhan Bank Canada",
    "CTBC Bank of Canada",
    "President's Choice Bank",
    "Amex Bank of Canada",
    "Tapestry Saving",
    "ICICI Bank Canada",
    "Canada Trust Company",
    "Manulife Bank of Canada",
    "EQ Bank (Equitable Bank)",
    "Wealthsimple Investments",
    "Habib Canadian Bank",
    "Central 1 Credit Union",
    "Fédération des caisses Desjardins du Québec",
    "Caisses populaires de l'Ontario",
    "Meridian Credit Union",
    "Vancity Credit Union",
    "First West Credit Union",
    "ATB Financial (Alberta Treasury Branches)",
    "Coast Capital Savings Federal Credit Union",
    "Conexus Credit Union"
]

def check_rate_limit(user_id: str, limit: int = 15, window_seconds: int = 10):
    """
    Enforces a rate limit of `limit` requests per `window_seconds` per user.
    """
    now = datetime.now()
    cutoff = now - timedelta(seconds=window_seconds)
    
    user_requests = RATE_LIMIT_STORE.get(user_id, [])
    user_requests = [t for t in user_requests if t > cutoff]
    
    if len(user_requests) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment."
        )
        
    user_requests.append(now)
    RATE_LIMIT_STORE[user_id] = user_requests

async def simulate_network_latency():
    """
    Simulates external API lookup network latency between 150ms and 450ms.
    """
    delay = random.uniform(0.15, 0.45)
    await asyncio.sleep(delay)

async def search_us_banks_fdic(query: str) -> List[str]:
    """
    Queries the official FDIC institutions API using full-text wildcard search.
    Returns empty list if query is too short or if API lookup fails.
    """
    if not query or len(query) < 1:
        return []
        
    # Wildcard search on Name (e.g. search=NAME:Chase*) directly targeting the final API endpoint
    url = f"https://api.fdic.gov/banks/institutions?search=NAME:{query}*&fields=NAME&limit=15"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=8.0, follow_redirects=True)
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for item in data.get("data", []):
                    name = item.get("data", {}).get("NAME")
                    if name:
                        # Clean up formatting to title case
                        results.append(name.title())
                if results:
                    return sorted(list(set(results)))
    except Exception as e:
        logger.error(f"FDIC API search request failed: {e}")
        
    return []

async def get_banks_by_country(country: CountryType, query: str) -> List[str]:
    """
    Returns filtered bank list matching query based on the registered country.
    For US: Queries the live FDIC Institutions API.
    For CA: Filters the Payments Canada registry locally.
    """
    if country == CountryType.US:
        return await search_us_banks_fdic(query)
        
    elif country == CountryType.CA:
        if not query or len(query) < 1:
            return []
        query_lower = query.lower()
        return [b for b in CA_BANKS_REGISTRY if query_lower in b.lower()]
        
    return []
