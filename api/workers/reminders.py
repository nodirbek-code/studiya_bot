"""
Celery workers — eslatmalar va to'lov timeout
"""
import asyncio
from datetime import date, datetime, timedelta

from celery import shared_task
from celery.utils.log import get_task_logger

from core.celery_app import celery_app
from core.config import settings

logger = get_task_logger(__name__)


# ─── To'lov timeout ───────────────────────────────────────────
@celery_app.task(name="workers.payment_timeout.cancel_unpaid_booking", bind=True, max_retries=3)
def cancel_unpaid_booking(self, booking_id: str):
    """
    Bron yaratilgandan 10 daqiqa o'tgach ishga tushadi.
    Agar to'lov bo'lmagan bo'lsa — bronni bekor qiladi
    va foydalanuvchiga xabar yuboradi.
    """
    try:
        asyncio.run(_do_cancel_unpaid(booking_id))
    except Exception as exc:
        logger.error(f"cancel_unpaid_booking failed: {exc}")
        raise self.retry(exc=exc, countdown=60)


async def _do_cancel_unpaid(booking_id: str):
    from core.database import AsyncSessionLocal
    from models.models import Booking, BookingStatus
    from sqlalchemy import select, and_

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Booking).where(
                and_(
                    Booking.id == booking_id,
                    Booking.status == BookingStatus.pending_payment,
                )
            )
        )
        booking = result.scalar_one_or_none()

        if not booking:
            return  # Allaqachon to'langan yoki bekor qilingan

        booking.status = BookingStatus.cancelled
        await db.commit()

        # Foydalanuvchiga xabar
        await _notify_booking_cancelled(booking.user_id, booking_id)
        logger.info(f"Booking {booking_id} cancelled due to payment timeout")


async def _notify_booking_cancelled(user_id: int, booking_id: str):
    """Bot orqali foydalanuvchiga bekor xabari"""
    import aiohttp
    payload = {
        "user_id": user_id,
        "booking_id": booking_id,
        "reason": "payment_timeout",
    }
    try:
        async with aiohttp.ClientSession() as session:
            await session.post(
                f"{settings.api_base_url}/api/internal/notify-cancelled",
                json=payload,
                headers={"X-Bot-Secret": settings.webhook_secret},
                timeout=aiohttp.ClientTimeout(total=10),
            )
    except Exception as e:
        logger.error(f"Failed to notify user {user_id}: {e}")


# ─── Kunlik jadval eslatmasi ──────────────────────────────────
@celery_app.task(name="workers.reminders.send_daily_schedule_reminder")
def send_daily_schedule_reminder():
    """Har kuni 8:00 da — jadval kiritilmagan bo'lsa eslatadi"""
    asyncio.run(_do_daily_reminder())


async def _do_daily_reminder():
    from core.database import AsyncSessionLocal
    from models.models import Schedule, ScheduleReminderState
    from sqlalchemy import select

    today = date.today()

    async with AsyncSessionLocal() as db:
        # Bugungi jadval borligini tekshirish
        sched_result = await db.execute(
            select(Schedule).where(Schedule.date == today)
        )
        schedule = sched_result.scalar_one_or_none()

        if schedule:
            return  # Jadval kiritilgan — eslatish shart emas

        # Reminder state'ni yangilash
        state_result = await db.execute(
            select(ScheduleReminderState).where(ScheduleReminderState.date == today)
        )
        reminder_state = state_result.scalar_one_or_none()

        if not reminder_state:
            reminder_state = ScheduleReminderState(date=today, reminder_count=0)
            db.add(reminder_state)

        reminder_state.reminder_count += 1
        reminder_state.last_reminded_at = datetime.utcnow()
        await db.commit()

    # Admin'larga xabar
    await _send_schedule_reminder_to_admins(today)


async def _send_schedule_reminder_to_admins(today: date):
    import aiohttp
    today_str = today.strftime("%d.%m.%Y")
    payload = {
        "admin_ids": settings.admin_ids_list,
        "date": today.isoformat(),
        "message": (
            f"📅 <b>{today_str}</b> uchun ish vaqti kiritilmagan!\n\n"
            f"Bugun ish qilasizmi? Ish vaqtini kiriting:\n"
            f"/schedule"
        ),
    }
    try:
        async with aiohttp.ClientSession() as session:
            await session.post(
                f"{settings.api_base_url}/api/internal/notify-admins",
                json=payload,
                headers={"X-Bot-Secret": settings.webhook_secret},
                timeout=aiohttp.ClientTimeout(total=15),
            )
    except Exception as e:
        logger.error(f"Failed to send schedule reminder: {e}")


# ─── Jadval kiritilganligini tekshirish (har 30 daqiqa) ───────
@celery_app.task(name="workers.reminders.check_schedule_filled")
def check_schedule_filled():
    """Ish vaqtlarida (9-18) jadval yo'q bo'lsa qayta eslatadi"""
    now = datetime.now()
    # Faqat ish vaqtlarida eslatish (9:00 - 18:00)
    if not (9 <= now.hour < 18):
        return
    asyncio.run(_do_daily_reminder())


# ─── Ertangi kun uchun eslatma (kechqurun 21:00) ──────────────
@celery_app.task(name="workers.reminders.send_tomorrow_reminder")
def send_tomorrow_reminder():
    """Kechqurun 21:00 — ertangi jadval kiritilmagan bo'lsa"""
    asyncio.run(_do_tomorrow_reminder())


async def _do_tomorrow_reminder():
    from core.database import AsyncSessionLocal
    from models.models import Schedule
    from sqlalchemy import select

    tomorrow = date.today() + timedelta(days=1)

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Schedule).where(Schedule.date == tomorrow)
        )
        if result.scalar_one_or_none():
            return  # Ertangi jadval bor

    await _send_schedule_reminder_to_admins(tomorrow)


# ─── Admin'ga yangi bron xabari ───────────────────────────────
@celery_app.task(name="workers.reminders.notify_admin_new_booking")
def notify_admin_new_booking(booking_id: str):
    asyncio.run(_do_notify_admin_booking(booking_id))


async def _do_notify_admin_booking(booking_id: str):
    from core.database import AsyncSessionLocal
    from models.models import Booking
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Booking)
            .where(Booking.id == booking_id)
            .options(
                selectinload(Booking.user),
                selectinload(Booking.staff),
                selectinload(Booking.service),
            )
        )
        booking = result.scalar_one_or_none()
        if not booking:
            return

        import aiohttp
        payload = {
            "admin_ids": settings.admin_ids_list,
            "booking": {
                "id": booking.id,
                "user_name": booking.user.full_name,
                "user_id": booking.user_id,
                "staff": booking.staff.name if booking.staff else "Belgilanmagan",
                "service": booking.service.name if booking.service else "Paket",
                "start_time": booking.start_time.strftime("%d.%m.%Y %H:%M"),
                "deposit": float(booking.deposit_amount),
            }
        }

        async with aiohttp.ClientSession() as session:
            await session.post(
                f"{settings.api_base_url}/api/internal/notify-admin-booking",
                json=payload,
                headers={"X-Bot-Secret": settings.webhook_secret},
                timeout=aiohttp.ClientTimeout(total=10),
            )


# ─── Sessiyadan keyin sharh so'rash (2 soat o'tgach) ─────────
@celery_app.task(name="workers.review_request.request_review")
def request_review_after_session(booking_id: str):
    asyncio.run(_do_request_review(booking_id))


async def _do_request_review(booking_id: str):
    from core.database import AsyncSessionLocal
    from models.models import Booking, BookingStatus
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Booking).where(Booking.id == booking_id)
        )
        booking = result.scalar_one_or_none()
        if not booking or booking.status != BookingStatus.completed:
            return
        if booking.review_requested:
            return  # Allaqachon so'ralgan

        booking.review_requested = True
        await db.commit()

        import aiohttp
        payload = {
            "user_id": booking.user_id,
            "booking_id": booking_id,
        }
        async with aiohttp.ClientSession() as session:
            await session.post(
                f"{settings.api_base_url}/api/internal/request-review",
                json=payload,
                headers={"X-Bot-Secret": settings.webhook_secret},
                timeout=aiohttp.ClientTimeout(total=10),
            )
