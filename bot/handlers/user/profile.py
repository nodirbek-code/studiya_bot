"""
User Profile handler — mijoz bronlari va loyalty
"""
import aiohttp
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command

from config import settings

router = Router()


@router.callback_query(F.data == "my_bookings")
async def on_my_bookings(call: CallbackQuery):
    data = await _fetch_my_bookings(call.from_user.id)
    if data is None:
        await call.answer("❌ Xatolik yuz berdi", show_alert=True)
        return

    if not data:
        await call.message.answer("📭 Sizda hozircha bronlar yo'q.")
        await call.answer()
        return

    lines = ["📋 <b>Bronlaringiz:</b>\n"]
    for b in data[:5]:
        status_emoji = {
            "confirmed": "✅",
            "pending_payment": "⏳",
            "completed": "🏁",
            "cancelled": "❌",
        }.get(b["status"], "•")
        lines.append(
            f"{status_emoji} {b['start_time'][:16].replace('T', ' ')} — "
            f"{b.get('service', 'Xizmat')}"
        )

    await call.message.answer("\n".join(lines))
    await call.answer()


async def _fetch_my_bookings(user_id: int) -> list | None:
    """Bot foydalanuvchi nomidan API dan bronlarni olish"""
    # Bot bevosita DB ga murojaat qiladi (shared DB)
    try:
        from core.database import AsyncSessionLocal
        from models.models import Booking, BookingStatus
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Booking)
                .where(Booking.user_id == user_id)
                .options(selectinload(Booking.service))
                .order_by(Booking.start_time.desc())
                .limit(5)
            )
            bookings = result.scalars().all()
            return [
                {
                    "id": b.id,
                    "start_time": b.start_time.isoformat(),
                    "service": b.service.name if b.service else "Paket",
                    "status": b.status.value,
                }
                for b in bookings
            ]
    except Exception:
        return None
