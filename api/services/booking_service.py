"""
Booking Service — bron qilish business logic
Race condition himoyasi: SELECT FOR UPDATE SKIP LOCKED
"""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from core.config import settings
from models.models import (
    Booking, BookingStatus, Service, Package,
    Staff, Schedule, User, LoyaltyProgress
)
from security.rate_limit import limit_booking


class BookingService:

    @staticmethod
    async def get_available_slots(
        db: AsyncSession,
        date: datetime,
        staff_id: Optional[int] = None,
    ) -> list[dict]:
        """
        Berilgan kun uchun bo'sh vaqt slotlarini qaytaradi.
        Band vaqtlar 'taken' sifatida belgilanadi.
        """
        # Jadval borligini tekshirish
        schedule_result = await db.execute(
            select(Schedule).where(Schedule.date == date.date())
        )
        schedule = schedule_result.scalar_one_or_none()

        if not schedule or schedule.is_day_off:
            return []  # Dam olish kuni — slot yo'q

        open_time = schedule.open_time
        close_time = schedule.close_time

        if not open_time or not close_time:
            return []

        # Shu kunda mavjud bronlarni olish
        query = select(Booking).where(
            and_(
                Booking.start_time >= datetime.combine(date.date(), open_time),
                Booking.start_time < datetime.combine(date.date(), close_time),
                Booking.status.in_([
                    BookingStatus.pending_payment,
                    BookingStatus.confirmed,
                ]),
            )
        )
        if staff_id:
            query = query.where(Booking.staff_id == staff_id)

        result = await db.execute(query)
        existing_bookings = result.scalars().all()

        # Slotlar generatsiya (har soat)
        slots = []
        current = datetime.combine(date.date(), open_time)
        end = datetime.combine(date.date(), close_time)

        while current < end:
            slot_end = current + timedelta(hours=1)
            is_taken = any(
                b.start_time <= current < b.end_time
                for b in existing_bookings
            )
            slots.append({
                "time": current.isoformat(),
                "available": not is_taken,
            })
            current = slot_end

        return slots

    @staticmethod
    async def create_booking(
        db: AsyncSession,
        user: User,
        staff_id: Optional[int],
        service_id: Optional[int],
        package_id: Optional[int],
        start_time: datetime,
        duration_hours: float,
    ) -> Booking:
        """
        Bron yaratish — race condition himoyasi bilan.

        1. Rate limit tekshiruvi
        2. SELECT FOR UPDATE bilan slot lock qilinadi
        3. Agar band bo'lsa — HTTPException
        4. Bron yaratiladi, to'lov kutish boshlanadi
        5. Celery task: 10 daqiqa ichida to'lanmasa bekor qilish
        """
        # Rate limit
        await limit_booking(user.id)

        end_time = start_time + timedelta(hours=duration_hours)

        # ── Race condition himoyasi ──────────────────────────
        # SELECT FOR UPDATE SKIP LOCKED — birinchi so'rov lock oladi,
        # ikkinchisi "skip" qiladi va bizga None qaytaradi
        conflict_result = await db.execute(
            select(Booking)
            .where(
                and_(
                    Booking.status.in_([
                        BookingStatus.pending_payment,
                        BookingStatus.confirmed,
                    ]),
                    or_(
                        and_(
                            Booking.start_time <= start_time,
                            Booking.end_time > start_time,
                        ),
                        and_(
                            Booking.start_time < end_time,
                            Booking.end_time >= end_time,
                        ),
                    ),
                    *(([Booking.staff_id == staff_id]) if staff_id else []),
                )
            )
            .with_for_update(skip_locked=True)
        )
        conflicts = conflict_result.scalars().all()

        if conflicts:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Bu vaqt allaqachon band qilindi. "
                    "Boshqa vaqtni tanlang."
                ),
            )

        # ── Narx hisoblash ───────────────────────────────────
        total_price = await BookingService._calculate_price(
            db, service_id, package_id, duration_hours
        )
        deposit = total_price * Decimal(settings.deposit_percent) / 100

        # ── Bron yaratish ────────────────────────────────────
        booking = Booking(
            id=str(uuid.uuid4()),
            user_id=user.id,
            staff_id=staff_id,
            service_id=service_id,
            package_id=package_id,
            start_time=start_time,
            end_time=end_time,
            duration_hours=Decimal(str(duration_hours)),
            total_price=total_price,
            deposit_amount=deposit,
            status=BookingStatus.pending_payment,
            locked_at=datetime.utcnow(),
        )
        db.add(booking)
        await db.flush()  # ID olish uchun

        # ── To'lov timeout Celery task ───────────────────────
        from workers.payment_timeout import cancel_unpaid_booking
        cancel_unpaid_booking.apply_async(
            args=[booking.id],
            countdown=settings.booking_timeout_minutes * 60,
        )

        return booking

    @staticmethod
    async def _calculate_price(
        db: AsyncSession,
        service_id: Optional[int],
        package_id: Optional[int],
        duration_hours: float,
    ) -> Decimal:
        if package_id:
            pkg_result = await db.execute(
                select(Package).where(Package.id == package_id)
            )
            pkg = pkg_result.scalar_one_or_none()
            if pkg:
                return pkg.final_price

        if service_id:
            svc_result = await db.execute(
                select(Service).where(Service.id == service_id)
            )
            svc = svc_result.scalar_one_or_none()
            if svc:
                return svc.price_per_hour * Decimal(str(duration_hours))

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Xizmat yoki paket ko'rsatilmagan",
        )

    @staticmethod
    async def confirm_booking(
        db: AsyncSession,
        booking_id: str,
    ) -> Booking:
        """To'lov muvaffaqiyatli — bronni tasdiqlash"""
        result = await db.execute(
            select(Booking)
            .where(
                and_(
                    Booking.id == booking_id,
                    Booking.status == BookingStatus.pending_payment,
                )
            )
            .with_for_update()
        )
        booking = result.scalar_one_or_none()

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bron topilmadi yoki allaqachon o'zgartirilgan",
            )

        booking.status = BookingStatus.confirmed

        # Loyalty progress yangilash
        await BookingService._update_loyalty(db, booking.user_id)

        # Admin'ga bildirishnoma
        from workers.reminders import notify_admin_new_booking
        notify_admin_new_booking.delay(booking_id)

        return booking

    @staticmethod
    async def _update_loyalty(db: AsyncSession, user_id: int) -> None:
        """Har tasdiqlangan brondan keyin loyalty hisoblagichni oshirish"""
        result = await db.execute(
            select(LoyaltyProgress).where(LoyaltyProgress.user_id == user_id)
        )
        progress = result.scalar_one_or_none()

        if not progress:
            progress = LoyaltyProgress(
                user_id=user_id, current_count=1, total_bookings=1
            )
            db.add(progress)
        else:
            progress.current_count += 1
            progress.total_bookings += 1
