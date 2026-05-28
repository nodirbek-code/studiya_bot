"""
Admin sharh moderatsiya handler
Bot orqali sharh tasdiqlash yoki rad etish
"""
import aiohttp
from aiogram import Router, F
from aiogram.types import CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from config import settings

router = Router()


def review_moderate_keyboard(review_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(
                text="✅ Tasdiqlash",
                callback_data=f"review_approve:{review_id}",
            ),
            InlineKeyboardButton(
                text="❌ Rad etish",
                callback_data=f"review_reject:{review_id}",
            ),
        ]
    ])


@router.callback_query(F.data.startswith("review_approve:"))
async def on_review_approve(call: CallbackQuery):
    if call.from_user.id not in settings.admin_ids_list:
        return

    review_id = int(call.data.split(":")[1])
    success = await _moderate_review(review_id, "approve")

    if success:
        await call.message.edit_reply_markup(reply_markup=None)
        await call.message.answer(f"✅ Sharh #{review_id} tasdiqlandi va portfolioda ko'rinadi.")
    else:
        await call.answer("❌ Xatolik yuz berdi", show_alert=True)


@router.callback_query(F.data.startswith("review_reject:"))
async def on_review_reject(call: CallbackQuery):
    if call.from_user.id not in settings.admin_ids_list:
        return

    review_id = int(call.data.split(":")[1])
    success = await _moderate_review(review_id, "reject")

    if success:
        await call.message.edit_reply_markup(reply_markup=None)
        await call.message.answer(f"🚫 Sharh #{review_id} rad etildi.")
    else:
        await call.answer("❌ Xatolik yuz berdi", show_alert=True)


async def _moderate_review(review_id: int, action: str) -> bool:
    endpoint = "approve" if action == "approve" else "reject"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.patch(
                f"{settings.api_base_url}/api/reviews/{review_id}/{endpoint}",
                headers={"X-Bot-Secret": settings.webhook_secret},
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                return resp.status == 200
    except Exception:
        return False
