"""
Admin Broadcast handler — bot tomonidagi xabar yuborish
Va ichki notification server (API dan kelgan xabarlar)
"""
from aiogram import Router, F, Bot
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.exceptions import TelegramForbiddenError, TelegramBadRequest

from config import settings

router = Router()


class BroadcastStates(StatesGroup):
    waiting_content = State()
    waiting_target = State()
    confirm = State()


def target_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="👥 Hammaga", callback_data="bc_target:all"),
            InlineKeyboardButton(text="🎯 Bronlaganlarga", callback_data="bc_target:booked_users"),
        ],
        [InlineKeyboardButton(text="❌ Bekor", callback_data="bc_cancel")],
    ])


def confirm_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Yuborish", callback_data="bc_send"),
            InlineKeyboardButton(text="❌ Bekor", callback_data="bc_cancel"),
        ]
    ])


@router.message(Command("broadcast"), F.from_user.id.func(
    lambda uid: uid in settings.admin_ids_list
))
async def cmd_broadcast(message: Message, state: FSMContext):
    await state.set_state(BroadcastStates.waiting_content)
    await message.answer(
        "📢 <b>Xabar yuborish</b>\n\n"
        "Yubormoqchi bo'lgan xabarni yozing.\n"
        "Rasm, video, gif yoki matn bo'lishi mumkin.\n\n"
        "<i>Bekor qilish uchun /cancel</i>"
    )


@router.message(BroadcastStates.waiting_content)
async def on_broadcast_content(message: Message, state: FSMContext, bot: Bot):
    # Xabar turini aniqlash
    content = {}
    if message.photo:
        content = {
            "type": "photo",
            "file_id": message.photo[-1].file_id,
            "caption": message.caption or "",
        }
    elif message.video:
        content = {
            "type": "video",
            "file_id": message.video.file_id,
            "caption": message.caption or "",
        }
    elif message.animation:
        content = {
            "type": "animation",
            "file_id": message.animation.file_id,
            "caption": message.caption or "",
        }
    elif message.text:
        content = {"type": "text", "text": message.text}
    else:
        await message.answer("❌ Faqat matn, rasm, video yoki gif yuborishingiz mumkin.")
        return

    await state.update_data(content=content)
    await state.set_state(BroadcastStates.waiting_target)

    # Preview
    preview_text = (
        f"📋 <b>Preview:</b>\n"
        f"Tur: {content['type']}\n"
        f"Matn: {content.get('text', content.get('caption', ''))[:100]}\n\n"
        f"Kimga yuborilsin?"
    )
    await message.answer(preview_text, reply_markup=target_keyboard())


@router.callback_query(F.data.startswith("bc_target:"))
async def on_target_select(call, state: FSMContext):
    if call.from_user.id not in settings.admin_ids_list:
        return

    target = call.data.split(":")[1]
    target_label = "Hammaga" if target == "all" else "Bronlagan mijozlarga"

    await state.update_data(target=target)
    await state.set_state(BroadcastStates.confirm)

    data = await state.get_data()
    content = data.get("content", {})

    await call.message.edit_text(
        f"⚠️ <b>Tasdiqlang</b>\n\n"
        f"Kimga: <b>{target_label}</b>\n"
        f"Tur: {content.get('type')}\n\n"
        f"Yuborilsinmi?",
        reply_markup=confirm_keyboard(),
    )
    await call.answer()


@router.callback_query(F.data == "bc_send", BroadcastStates.confirm)
async def on_broadcast_confirm(call, state: FSMContext):
    if call.from_user.id not in settings.admin_ids_list:
        return

    data = await state.get_data()
    content = data.get("content", {})
    target = data.get("target", "all")

    await call.message.edit_text("⏳ Xabar navbatga qo'yilmoqda...")
    await state.clear()

    # API ga yuborish
    import aiohttp
    payload = {
        "target": target,
        "message_text": content.get("text") or content.get("caption"),
        "media_url": content.get("file_id"),
        "media_type": content.get("type") if content.get("type") != "text" else None,
    }

    success = False
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{settings.api_base_url}/api/admin/broadcast",
                json=payload,
                headers={"X-Bot-Secret": settings.webhook_secret},
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                success = resp.status == 200
    except Exception:
        pass

    if success:
        await call.message.edit_text("✅ Xabar navbatga qo'yildi. Tez orada yuboriladi.")
    else:
        await call.message.edit_text("❌ Xatolik yuz berdi. Qayta urinib ko'ring.")

    await call.answer()


@router.callback_query(F.data == "bc_cancel")
async def on_broadcast_cancel(call, state: FSMContext):
    await state.clear()
    await call.message.edit_text("❌ Bekor qilindi.")
    await call.answer()


# ══════════════════════════════════════════════════════════════
# Chunk yuboruvchi endpoint (API/Celery dan chaqiriladi)
# ══════════════════════════════════════════════════════════════
async def send_message_chunk(
    bot: Bot,
    user_ids: list[int],
    text: str | None,
    media_url: str | None,
    media_type: str | None,
) -> tuple[int, int]:
    """
    Bir guruh foydalanuvchiga xabar yuboradi.
    Yuborilganlar va xato sonini qaytaradi.
    """
    sent = 0
    failed = 0

    for user_id in user_ids:
        try:
            if media_type == "photo" and media_url:
                await bot.send_photo(user_id, media_url, caption=text or "")
            elif media_type == "video" and media_url:
                await bot.send_video(user_id, media_url, caption=text or "")
            elif media_type == "animation" and media_url:
                await bot.send_animation(user_id, media_url, caption=text or "")
            elif text:
                await bot.send_message(user_id, text, parse_mode="HTML")
            sent += 1
        except TelegramForbiddenError:
            # Foydalanuvchi botni bloklagan
            failed += 1
        except TelegramBadRequest:
            failed += 1
        except Exception:
            failed += 1

    return sent, failed
