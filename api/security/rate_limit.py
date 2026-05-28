"""
Rate limiting — Redis sliding window algoritmi
Spam va DDoS dan himoya
"""
import time
from fastapi import Request, HTTPException, status
import redis.asyncio as aioredis
from core.config import settings

# Redis connection pool
redis_client = aioredis.from_url(
    settings.redis_url,
    encoding="utf-8",
    decode_responses=True,
)


async def check_rate_limit(
    user_id: int,
    action: str,
    max_requests: int,
    window_seconds: int,
) -> None:
    """
    Sliding window rate limiter.

    action misollari:
    - "booking_attempt"  → 1 daqiqada 5 ta
    - "api_request"      → 1 daqiqada 60 ta
    - "payment_init"     → 1 soatda 10 ta
    """
    key = f"rate:{action}:{user_id}"
    now = time.time()
    window_start = now - window_seconds

    pipe = redis_client.pipeline()
    # Eski so'rovlarni o'chirish
    pipe.zremrangebyscore(key, 0, window_start)
    # Joriy so'rovlar sonini olish
    pipe.zcard(key)
    # Yangi so'rovni qo'shish
    pipe.zadd(key, {str(now): now})
    # TTL belgilash
    pipe.expire(key, window_seconds + 1)
    results = await pipe.execute()

    current_count = results[1]
    if current_count >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Ko'p so'rov yuborildi. {window_seconds} soniyadan keyin urinib ko'ring.",
            headers={"Retry-After": str(window_seconds)},
        )


# ─── Tayyor limitlar ──────────────────────────────────────────

async def limit_booking(user_id: int) -> None:
    """Bron so'rovi — 1 daqiqada max 5 ta"""
    await check_rate_limit(user_id, "booking_attempt", 5, 60)


async def limit_payment(user_id: int) -> None:
    """To'lov initializatsiya — 1 soatda max 10 ta"""
    await check_rate_limit(user_id, "payment_init", 10, 3600)


async def limit_api(user_id: int) -> None:
    """Umumiy API — 1 daqiqada max 60 ta"""
    await check_rate_limit(user_id, "api_request", 60, 60)
