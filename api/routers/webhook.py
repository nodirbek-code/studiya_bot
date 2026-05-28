"""
Webhook Router — Telegram webhook qabul qilish
va bot'ga ichki bildirishnomalar yuborish
"""
import asyncio
from fastapi import APIRouter, Request, Header, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from security.auth import verify_webhook_secret

router = APIRouter()

# Aiogram bot instance (bot/main.py dan import qilinmaydi — alohida process)
# API dan bot'ga xabar yuborish uchun HTTP so'rov ishlatamiz
import aiohttp

BOT_NOTIFY_URL = f"{settings.webhook_host}/bot-internal"


async def _send_to_bot(endpoint: str, payload: dict) -> bool:
    """Bot'ning ichki endpointiga xabar yuborish"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"http://bot:8001{endpoint}",
                json=payload,
                headers={"X-Bot-Secret": settings.webhook_secret},
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                return resp.status == 200
    except Exception:
        return False


# ── Telegram webhook ──────────────────────────────────────────
@router.post("/{secret}")
async def telegram_webhook(secret: str, request: Request):
    """
    Telegram'dan keluvchi update'larni qabul qilish.
    Secret URL orqali autentifikatsiya.
    """
    if not verify_webhook_secret(secret):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    update = await request.json()
    # Bu endpoint faqat Telegram update'ni qabul qiladi
    # Botning o'zi polling yoki alohida webhook server sifatida ishlaydi
    return {"ok": True}


# ── Ichki: foydalanuvchiga bekor xabari ──────────────────────
@router.post("/internal/notify-cancelled")
async def notify_cancelled(
    request: Request,
    x_bot_secret: str = Header(...),
):
    if not verify_webhook_secret(x_bot_secret):
        raise HTTPException(status_code=403)

    data = await request.json()
    await _send_to_bot("/notify/booking-cancelled", data)
    return {"ok": True}


# ── Ichki: admin'ga yangi bron xabari ────────────────────────
@router.post("/internal/notify-admin-booking")
async def notify_admin_booking(
    request: Request,
    x_bot_secret: str = Header(...),
):
    if not verify_webhook_secret(x_bot_secret):
        raise HTTPException(status_code=403)

    data = await request.json()
    await _send_to_bot("/notify/admin-booking", data)
    return {"ok": True}


# ── Ichki: admin'larga xabar ─────────────────────────────────
@router.post("/internal/notify-admins")
async def notify_admins(
    request: Request,
    x_bot_secret: str = Header(...),
):
    if not verify_webhook_secret(x_bot_secret):
        raise HTTPException(status_code=403)

    data = await request.json()
    await _send_to_bot("/notify/admins", data)
    return {"ok": True}


# ── Ichki: sharh so'rash ──────────────────────────────────────
@router.post("/internal/request-review")
async def request_review(
    request: Request,
    x_bot_secret: str = Header(...),
):
    if not verify_webhook_secret(x_bot_secret):
        raise HTTPException(status_code=403)

    data = await request.json()
    await _send_to_bot("/notify/request-review", data)
    return {"ok": True}
