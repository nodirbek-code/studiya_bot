"""
/start handler — foydalanuvchini kutib olish
Mini App tugmasi bilan
"""
from aiogram import Router, F
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.filters import CommandStart

from config import settings

router = Router()


def get_start_keyboard(is_admin: bool) -> InlineKeyboardMarkup:
    """Boshlang'ich menyu tugmalari"""
    buttons = [
        [
            InlineKeyboardButton(
                text="📸 Studiyani ochish",
                url="https://t.me",
            )
        ],
        [
            InlineKeyboardButton(
                text="📋 Bronlarim",
                callback_data="my_bookings",
            ),
            InlineKeyboardButton(
                text="ℹ️ Haqida",
                callback_data="about",
            ),
        ],
    ]

    if is_admin:
        buttons.append([
            InlineKeyboardButton(
                text="⚙️ Admin panel",
                callback_data="admin_panel",
            )
        ])

    return InlineKeyboardMarkup(inline_keyboard=buttons)


@router.message(CommandStart())
async def cmd_start(message: Message, is_admin: bool):
    name = message.from_user.first_name or "Mehmon"

    welcome_text = (
        f"Salom, <b>{name}</b>! 👋\n\n"
        f"<b>Lumière Studio</b>ga xush kelibsiz!\n\n"
        f"📸 Professional foto va video suratga tushish\n"
        f"🎬 Zamonaviy jihozlar va professional xodimlar\n"
        f"📅 Online bron qilish — tezkor va qulay\n\n"
        f"Quyidagi tugmani bosib studiya bilan tanishing:"
    )

    await message.answer(
        welcome_text,
        reply_markup=get_start_keyboard(is_admin),
    )


@router.message(F.text == "/help")
async def cmd_help(message: Message, is_admin: bool):
    help_text = (
        "<b>Qo'llanma</b>\n\n"
        "📸 <b>Studiyani ochish</b> — portfolio va bron qilish\n"
        "📋 <b>Bronlarim</b> — faol va o'tgan bronlaringiz\n"
    )
    if is_admin:
        help_text += (
            "\n<b>Admin buyruqlari:</b>\n"
            "/schedule — bugungi ish vaqtini kiritish\n"
            "/broadcast — barcha foydalanuvchilarga xabar\n"
            "/stats — statistika\n"
        )

    await message.answer(help_text, reply_markup=get_start_keyboard(is_admin))
