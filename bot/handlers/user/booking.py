"""
Booking handler — botdan bron holati ko'rish
Asosiy bron Mini App orqali ketadi, bu yerda faqat status va cancel
"""
from aiogram import Router, F
from aiogram.types import CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton

from config import settings

router = Router()


@router.callback_query(F.data == "about")
async def on_about(call: CallbackQuery):
    text = (
        "📸 <b>Lumière Studio</b>\n\n"
        "Professional foto va video suratga tushirish studiyasi.\n\n"
        "📅 Bron qilish uchun «Studiyani ochish» tugmasini bosing.\n"
        "📋 Bronlaringizni ko'rish uchun «Bronlarim» tugmasini bosing.\n\n"
        "📞 Savollar bo'lsa admin bilan bog'laning."
    )
    await call.message.answer(text)
    await call.answer()


@router.callback_query(F.data == "admin_panel")
async def on_admin_panel(call: CallbackQuery):
    if call.from_user.id not in settings.admin_ids_list:
        await call.answer("❌ Ruxsat yo'q", show_alert=True)
        return

    text = (
        "⚙️ <b>Admin panel</b>\n\n"
        "/schedule — bugungi jadval kiritish\n"
        "/broadcast — barcha foydalanuvchilarga xabar\n"
        "/stats — statistika ko'rish\n"
    )
    await call.message.answer(text)
    await call.answer()
