"""
Admin statistika handler
"""
import aiohttp
from aiogram import Router
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command

from config import settings

router = Router()


def period_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="Bugun", callback_data="stats:today"),
            InlineKeyboardButton(text="Hafta", callback_data="stats:week"),
            InlineKeyboardButton(text="Oy", callback_data="stats:month"),
        ]
    ])


@router.message(Command("stats"), lambda m: m.from_user.id in settings.admin_ids_list)
async def cmd_stats(message: Message):
    await message.answer("📊 Qaysi davr statistikasini ko'rmoqchisiz?", reply_markup=period_keyboard())


from aiogram import F
from aiogram.types import CallbackQuery


@router.callback_query(F.data.startswith("stats:"))
async def on_stats_period(call: CallbackQuery):
    if call.from_user.id not in settings.admin_ids_list:
        return

    period = call.data.split(":")[1]
    data = await _fetch_stats(period)

    if not data:
        await call.answer("❌ Ma'lumot olishda xatolik", show_alert=True)
        return

    period_label = {"today": "Bugun", "week": "Oxirgi 7 kun", "month": "Oxirgi 30 kun"}.get(period, period)

    top_staff = "\n".join(
        f"  • {s['name']}: {s['bookings']} ta" for s in data.get("top_staff", [])
    ) or "  —"

    busy_hours = ", ".join(
        f"{h['hour']}:00 ({h['count']}ta)" for h in data.get("busy_hours", [])[:3]
    ) or "—"

    text = (
        f"📊 <b>Statistika — {period_label}</b>\n\n"
        f"📅 Bronlar: <b>{data['total_bookings']}</b>\n"
        f"💰 Daromad: <b>{data['revenue']:,.0f} so'm</b>\n"
        f"❌ Bekor: <b>{data['cancelled']}</b>\n"
        f"👤 Yangi mijozlar: <b>{data['new_users']}</b>\n\n"
        f"👑 <b>Top xodimlar:</b>\n{top_staff}\n\n"
        f"⏰ <b>Band soatlar:</b> {busy_hours}"
    )

    await call.message.edit_text(text, reply_markup=period_keyboard())
    await call.answer()


async def _fetch_stats(period: str) -> dict | None:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{settings.api_base_url}/api/admin/stats",
                params={"period": period},
                headers={"X-Bot-Secret": settings.webhook_secret},
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                if resp.status == 200:
                    return await resp.json()
    except Exception:
        return None
