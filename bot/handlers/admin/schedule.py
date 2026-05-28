"""
Admin ish vaqti kiritish — FSM bilan
Har kuni bot so'raydi, kiritilgunicha eslatib turadi
"""
from datetime import date, datetime
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

from config import settings

router = Router()


# ─── FSM holatlari ────────────────────────────────────────────
class ScheduleStates(StatesGroup):
    waiting_open_time = State()
    waiting_close_time = State()
    confirm = State()


# ─── Admin filter ─────────────────────────────────────────────
def is_admin(message: Message) -> bool:
    return message.from_user.id in settings.admin_ids_list


# ─── Keyboard ─────────────────────────────────────────────────
def day_off_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="😴 Dam olish kuni", callback_data="schedule_day_off")],
    ])


def confirm_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Tasdiqlash", callback_data="schedule_confirm"),
            InlineKeyboardButton(text="❌ Bekor", callback_data="schedule_cancel"),
        ]
    ])


# ─── /schedule buyrug'i ───────────────────────────────────────
@router.message(Command("schedule"), F.from_user.id.func(
    lambda uid: uid in settings.admin_ids_list
))
async def cmd_schedule(message: Message, state: FSMContext):
    today = date.today().strftime("%d.%m.%Y")
    await state.set_state(ScheduleStates.waiting_open_time)
    await state.update_data(schedule_date=date.today().isoformat())

    await message.answer(
        f"📅 <b>{today}</b> uchun ish vaqtini kiriting\n\n"
        f"⏰ Ochilish vaqtini yuboring\n"
        f"<i>Misol: 09:00</i>",
        reply_markup=day_off_keyboard(),
    )


# ─── Dam olish kuni ───────────────────────────────────────────
@router.callback_query(F.data == "schedule_day_off")
async def on_day_off(call: CallbackQuery, state: FSMContext):
    if call.from_user.id not in settings.admin_ids_list:
        return

    data = await state.get_data()
    schedule_date = data.get("schedule_date", date.today().isoformat())

    # API ga yuborish
    success = await _save_schedule(schedule_date, None, None, is_day_off=True)

    await call.message.edit_text(
        f"😴 <b>{schedule_date}</b> — Dam olish kuni sifatida belgilandi."
    )
    await state.clear()
    await call.answer()


# ─── Ochilish vaqti ───────────────────────────────────────────
@router.message(ScheduleStates.waiting_open_time)
async def on_open_time(message: Message, state: FSMContext):
    if message.from_user.id not in settings.admin_ids_list:
        return

    text = message.text.strip()
    if not _validate_time(text):
        await message.answer(
            "❌ Vaqt noto'g'ri formatda.\n"
            "<i>To'g'ri format: 09:00 yoki 9:30</i>"
        )
        return

    await state.update_data(open_time=text)
    await state.set_state(ScheduleStates.waiting_close_time)

    await message.answer(
        f"✅ Ochilish vaqti: <b>{text}</b>\n\n"
        f"⏰ Yopilish vaqtini yuboring\n"
        f"<i>Misol: 22:00</i>"
    )


# ─── Yopilish vaqti ──────────────────────────────────────────
@router.message(ScheduleStates.waiting_close_time)
async def on_close_time(message: Message, state: FSMContext):
    if message.from_user.id not in settings.admin_ids_list:
        return

    text = message.text.strip()
    if not _validate_time(text):
        await message.answer("❌ Vaqt noto'g'ri formatda. Misol: 22:00")
        return

    data = await state.get_data()

    # Ochilish vaqtidan kech ekanligini tekshirish
    if not _is_later(text, data["open_time"]):
        await message.answer("❌ Yopilish vaqti ochilishdan kech bo'lishi kerak!")
        return

    await state.update_data(close_time=text)
    await state.set_state(ScheduleStates.confirm)

    schedule_date = data["schedule_date"]
    await message.answer(
        f"📋 <b>Tasdiqlang:</b>\n\n"
        f"📅 Sana: {schedule_date}\n"
        f"🕐 Ochilish: {data['open_time']}\n"
        f"🕙 Yopilish: {text}",
        reply_markup=confirm_keyboard(),
    )


# ─── Tasdiqlash ───────────────────────────────────────────────
@router.callback_query(F.data == "schedule_confirm", ScheduleStates.confirm)
async def on_confirm(call: CallbackQuery, state: FSMContext):
    if call.from_user.id not in settings.admin_ids_list:
        return

    data = await state.get_data()
    success = await _save_schedule(
        data["schedule_date"],
        data["open_time"],
        data["close_time"],
        is_day_off=False,
    )

    if success:
        await call.message.edit_text(
            f"✅ Jadval saqlandi!\n\n"
            f"📅 {data['schedule_date']}\n"
            f"🕐 {data['open_time']} — {data['close_time']}\n\n"
            f"Mijozlar bron qila olishadi."
        )
    else:
        await call.message.edit_text(
            "❌ Xatolik yuz berdi. Qayta urinib ko'ring: /schedule"
        )

    await state.clear()
    await call.answer()


# ─── Bekor qilish ─────────────────────────────────────────────
@router.callback_query(F.data == "schedule_cancel")
async def on_cancel(call: CallbackQuery, state: FSMContext):
    await state.clear()
    await call.message.edit_text("❌ Bekor qilindi. /schedule buyrug'i bilan qayta kiritishingiz mumkin.")
    await call.answer()


# ─── Yordamchi funksiyalar ────────────────────────────────────
def _validate_time(time_str: str) -> bool:
    """HH:MM formatni tekshirish"""
    try:
        datetime.strptime(time_str, "%H:%M")
        return True
    except ValueError:
        return False


def _is_later(time2: str, time1: str) -> bool:
    """time2 > time1 ekanligini tekshirish"""
    t1 = datetime.strptime(time1, "%H:%M")
    t2 = datetime.strptime(time2, "%H:%M")
    return t2 > t1


async def _save_schedule(
    schedule_date: str,
    open_time: str | None,
    close_time: str | None,
    is_day_off: bool,
) -> bool:
    """API ga jadval ma'lumotlarini yuborish"""
    import aiohttp
    from config import settings

    payload = {
        "date": schedule_date,
        "open_time": open_time,
        "close_time": close_time,
        "is_day_off": is_day_off,
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{settings.api_base_url}/api/admin/schedule",
                json=payload,
                headers={"X-Bot-Secret": settings.webhook_secret},
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                return resp.status in (200, 201)
    except Exception:
        return False
