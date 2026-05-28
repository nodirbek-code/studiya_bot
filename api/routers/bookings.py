"""
Bookings Router — bron CRUD
"""
from datetime import datetime, date
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from core.database import get_db
from models.models import Booking, BookingStatus, User
from schemas.catalog import BookingCreateIn, BookingOut
from security.auth import get_current_user
from services.booking_service import BookingService

router = APIRouter()


# ── Bo'sh vaqtlarni ko'rish ────────────────────────────────────
@router.get("/slots")
async def get_available_slots(
    date_str: str = Query(..., alias="date", description="YYYY-MM-DD format"),
    staff_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Berilgan sana uchun bo'sh/band soatlar.
    Mini App kalendar uchun.
    """
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sana formati: YYYY-MM-DD",
        )

    if target_date.date() < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O'tgan kunni tanlash mumkin emas",
        )

    slots = await BookingService.get_available_slots(db, target_date, staff_id)
    return {"date": date_str, "slots": slots}


# ── Bron yaratish ──────────────────────────────────────────────
@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def create_booking(
    data: BookingCreateIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Yangi bron yaratish.
    Race condition himoyasi — SELECT FOR UPDATE SKIP LOCKED.
    10 daqiqa ichida to'lov bo'lmasa avtomatik bekor qilinadi.
    """
    if not data.service_id and not data.package_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Xizmat yoki paket tanlanishi shart",
        )

    booking = await BookingService.create_booking(
        db=db,
        user=current_user,
        staff_id=data.staff_id,
        service_id=data.service_id,
        package_id=data.package_id,
        start_time=data.start_time,
        duration_hours=data.duration_hours,
    )
    await db.commit()
    return booking


# ── Foydalanuvchi bronlari ─────────────────────────────────────
@router.get("/my", response_model=list[BookingOut])
async def get_my_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Booking)
        .where(Booking.user_id == current_user.id)
        .options(
            selectinload(Booking.service),
            selectinload(Booking.staff),
            selectinload(Booking.package),
        )
        .order_by(Booking.start_time.desc())
        .limit(limit)
    )
    if status_filter:
        try:
            query = query.where(Booking.status == BookingStatus(status_filter))
        except ValueError:
            pass

    result = await db.execute(query)
    return result.scalars().all()


# ── Bitta bron ─────────────────────────────────────────────────
@router.get("/{booking_id}", response_model=BookingOut)
async def get_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Booking).where(
            and_(
                Booking.id == booking_id,
                Booking.user_id == current_user.id,
            )
        )
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Bron topilmadi")
    return booking


# ── Bronni bekor qilish ────────────────────────────────────────
@router.delete("/{booking_id}")
async def cancel_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Booking).where(
            and_(
                Booking.id == booking_id,
                Booking.user_id == current_user.id,
                Booking.status.in_([
                    BookingStatus.pending_payment,
                    BookingStatus.confirmed,
                ]),
            )
        )
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Bron topilmadi yoki bekor qilib bo'lmaydi",
        )

    # Sessiyaga 24 soatdan kam qolgan bo'lsa — bekor qilish mumkin emas
    from datetime import timedelta
    if booking.status == BookingStatus.confirmed:
        time_left = booking.start_time - datetime.utcnow()
        if time_left.total_seconds() < 86400:  # 24 soat
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sessiyaga 24 soatdan kam qolganda bekor qilib bo'lmaydi",
            )

    booking.status = BookingStatus.cancelled
    await db.commit()

    # Admin'ga xabar
    from workers.reminders import notify_admin_new_booking
    # (bekor xabari uchun alohida task ham bo'lishi mumkin)

    return {"message": "Bron bekor qilindi", "booking_id": booking_id}
