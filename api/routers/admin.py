"""
Admin Router — jadval, broadcast, statistika, paketlar, loyalty
"""
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from core.database import get_db
from models.models import (
    Schedule, ScheduleReminderState, Booking, BookingStatus,
    Broadcast, BroadcastTarget, Package, LoyaltyConfig,
    RewardType, User, Payment, PaymentStatus, Service, Staff,
)
from schemas.catalog import ScheduleIn, BroadcastIn, LoyaltyConfigIn, PackageCreateIn
from security.auth import get_admin_user

router = APIRouter()


# ══════════════════════════════════════════════════════════════
# JADVAL (SCHEDULE)
# ══════════════════════════════════════════════════════════════
@router.post("/schedule", status_code=201)
async def save_schedule(
    data: ScheduleIn,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Kun uchun ish vaqtini saqlash yoki yangilash"""
    target_date = datetime.strptime(data.date, "%Y-%m-%d").date()

    # Mavjudini topish
    result = await db.execute(
        select(Schedule).where(Schedule.date == target_date)
    )
    schedule = result.scalar_one_or_none()

    if schedule:
        # Yangilash
        schedule.is_day_off = data.is_day_off
        schedule.note = data.note
        if not data.is_day_off:
            schedule.open_time = datetime.strptime(data.open_time, "%H:%M").time()
            schedule.close_time = datetime.strptime(data.close_time, "%H:%M").time()
    else:
        # Yangi yaratish
        open_t = datetime.strptime(data.open_time, "%H:%M").time() if data.open_time else None
        close_t = datetime.strptime(data.close_time, "%H:%M").time() if data.close_time else None
        schedule = Schedule(
            date=target_date,
            open_time=open_t,
            close_time=close_t,
            is_day_off=data.is_day_off,
            note=data.note,
        )
        db.add(schedule)

    # Reminder state: kiritildi deb belgilash
    state_result = await db.execute(
        select(ScheduleReminderState).where(ScheduleReminderState.date == target_date)
    )
    reminder_state = state_result.scalar_one_or_none()
    if reminder_state:
        reminder_state.is_filled = True
    else:
        db.add(ScheduleReminderState(date=target_date, is_filled=True))

    await db.commit()
    return {"message": "Jadval saqlandi", "date": data.date}


@router.get("/schedule")
async def get_schedule(
    from_date: Optional[str] = None,
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Keyingi N kun uchun jadval"""
    start = datetime.strptime(from_date, "%Y-%m-%d").date() if from_date else date.today()
    end = start + timedelta(days=days)

    result = await db.execute(
        select(Schedule).where(
            and_(Schedule.date >= start, Schedule.date < end)
        ).order_by(Schedule.date)
    )
    schedules = result.scalars().all()
    return [
        {
            "date": str(s.date),
            "open_time": str(s.open_time) if s.open_time else None,
            "close_time": str(s.close_time) if s.close_time else None,
            "is_day_off": s.is_day_off,
            "note": s.note,
        }
        for s in schedules
    ]


# ══════════════════════════════════════════════════════════════
# BRONLAR (admin ko'rishi)
# ══════════════════════════════════════════════════════════════
@router.get("/bookings")
async def get_all_bookings(
    status_filter: Optional[str] = None,
    from_date: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    from sqlalchemy.orm import selectinload
    query = (
        select(Booking)
        .options(
            selectinload(Booking.user),
            selectinload(Booking.staff),
            selectinload(Booking.service),
        )
        .order_by(Booking.start_time.desc())
        .limit(limit)
    )
    if status_filter:
        query = query.where(Booking.status == BookingStatus(status_filter))
    if from_date:
        fd = datetime.strptime(from_date, "%Y-%m-%d")
        query = query.where(Booking.start_time >= fd)

    result = await db.execute(query)
    bookings = result.scalars().all()

    return [
        {
            "id": b.id,
            "user": {"id": b.user_id, "name": b.user.full_name},
            "staff": b.staff.name if b.staff else None,
            "service": b.service.name if b.service else "Paket",
            "start_time": b.start_time.isoformat(),
            "end_time": b.end_time.isoformat(),
            "total_price": float(b.total_price),
            "deposit": float(b.deposit_amount),
            "status": b.status.value,
        }
        for b in bookings
    ]


@router.patch("/bookings/{booking_id}/complete")
async def mark_completed(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Sessiya bajarildi deb belgilash — sharh so'rash ishga tushadi"""
    result = await db.execute(
        select(Booking).where(
            and_(Booking.id == booking_id, Booking.status == BookingStatus.confirmed)
        )
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Bron topilmadi")

    booking.status = BookingStatus.completed
    await db.flush()

    # 2 soatdan keyin sharh so'rash
    from core.celery_app import celery_app
    celery_app.send_task(
        "workers.review_request.request_review_after_session",
        args=[booking_id],
        countdown=7200,  # 2 soat
    )

    await db.commit()
    return {"message": "Bajarildi deb belgilandi"}


# ══════════════════════════════════════════════════════════════
# BROADCAST (xabar yuborish)
# ══════════════════════════════════════════════════════════════
@router.post("/broadcast")
async def create_broadcast(
    data: BroadcastIn,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
):
    """
    Barcha yoki bronlagan foydalanuvchilarga xabar yuborish.
    Celery orqali asinxron — ko'p foydalanuvchi bo'lsa bot bloklamas.
    """
    broadcast = Broadcast(
        admin_id=current_admin.id,
        target=BroadcastTarget(data.target),
        message_text=data.message_text,
        media_url=data.media_url,
        media_type=data.media_type,
    )
    db.add(broadcast)
    await db.flush()

    # Celery task — fonga jo'natamiz
    from core.celery_app import celery_app
    celery_app.send_task(
        "workers.broadcast.send_broadcast",
        args=[broadcast.id],
    )

    await db.commit()
    return {"message": "Broadcast navbatga qo'yildi", "broadcast_id": broadcast.id}


@router.get("/broadcast/history")
async def broadcast_history(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    result = await db.execute(
        select(Broadcast).order_by(Broadcast.created_at.desc()).limit(limit)
    )
    items = result.scalars().all()
    return [
        {
            "id": b.id,
            "target": b.target.value,
            "text": (b.message_text or "")[:80],
            "media_type": b.media_type,
            "sent_count": b.sent_count,
            "failed_count": b.failed_count,
            "is_sent": b.is_sent,
            "sent_at": b.sent_at.isoformat() if b.sent_at else None,
            "created_at": b.created_at.isoformat(),
        }
        for b in items
    ]


# ══════════════════════════════════════════════════════════════
# PAKETLAR — admin CRUD
# ══════════════════════════════════════════════════════════════
@router.post("/packages", status_code=201)
async def create_package(
    data: PackageCreateIn,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    pkg = Package(**data.model_dump())
    db.add(pkg)
    await db.commit()
    return {"message": "Paket yaratildi", "id": pkg.id}


@router.put("/packages/{pkg_id}")
async def update_package(
    pkg_id: int,
    data: PackageCreateIn,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    result = await db.execute(select(Package).where(Package.id == pkg_id))
    pkg = result.scalar_one_or_none()
    if not pkg:
        raise HTTPException(status_code=404, detail="Paket topilmadi")
    for k, v in data.model_dump().items():
        setattr(pkg, k, v)
    await db.commit()
    return {"message": "Paket yangilandi"}


@router.delete("/packages/{pkg_id}")
async def delete_package(
    pkg_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    result = await db.execute(select(Package).where(Package.id == pkg_id))
    pkg = result.scalar_one_or_none()
    if not pkg:
        raise HTTPException(status_code=404, detail="Paket topilmadi")
    pkg.is_active = False  # Soft delete
    await db.commit()
    return {"message": "Paket o'chirildi"}


# ══════════════════════════════════════════════════════════════
# LOYALTY CONFIG
# ══════════════════════════════════════════════════════════════
@router.get("/loyalty")
async def get_loyalty_config(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    result = await db.execute(select(LoyaltyConfig).limit(1))
    config = result.scalar_one_or_none()
    if not config:
        return {"is_active": False, "bookings_required": 5, "reward_type": "free_hour", "reward_value": 1}
    return config


@router.put("/loyalty")
async def update_loyalty(
    data: LoyaltyConfigIn,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    result = await db.execute(select(LoyaltyConfig).limit(1))
    config = result.scalar_one_or_none()
    if not config:
        config = LoyaltyConfig()
        db.add(config)

    config.is_active = data.is_active
    config.bookings_required = data.bookings_required
    config.reward_type = RewardType(data.reward_type)
    config.reward_value = data.reward_value
    config.description = data.description
    await db.commit()
    return {"message": "Loyalty tizimi yangilandi"}


# ══════════════════════════════════════════════════════════════
# STATISTIKA
# ══════════════════════════════════════════════════════════════
@router.get("/stats")
async def get_stats(
    period: str = "month",  # "today", "week", "month"
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    now = datetime.utcnow()
    if period == "today":
        from_dt = now.replace(hour=0, minute=0, second=0)
    elif period == "week":
        from_dt = now - timedelta(days=7)
    else:
        from_dt = now - timedelta(days=30)

    # Umumiy bronlar
    total_bookings = await db.scalar(
        select(func.count(Booking.id)).where(
            and_(Booking.created_at >= from_dt, Booking.status == BookingStatus.confirmed)
        )
    )

    # Daromad (tasdiqlangan to'lovlar)
    revenue = await db.scalar(
        select(func.sum(Payment.amount)).where(
            and_(
                Payment.created_at >= from_dt,
                Payment.status == PaymentStatus.paid,
            )
        )
    )

    # Bekor qilinganlar
    cancelled = await db.scalar(
        select(func.count(Booking.id)).where(
            and_(
                Booking.created_at >= from_dt,
                Booking.status == BookingStatus.cancelled,
            )
        )
    )

    # Eng band soatlar
    busy_hours_result = await db.execute(
        select(
            func.extract("hour", Booking.start_time).label("hour"),
            func.count().label("cnt"),
        )
        .where(
            and_(
                Booking.created_at >= from_dt,
                Booking.status.in_([BookingStatus.confirmed, BookingStatus.completed]),
            )
        )
        .group_by("hour")
        .order_by(func.count().desc())
        .limit(5)
    )
    busy_hours = [{"hour": int(r.hour), "count": r.cnt} for r in busy_hours_result]

    # Top xodimlar
    top_staff_result = await db.execute(
        select(
            Staff.name,
            func.count(Booking.id).label("cnt"),
        )
        .join(Booking, Booking.staff_id == Staff.id)
        .where(Booking.created_at >= from_dt)
        .group_by(Staff.name)
        .order_by(func.count(Booking.id).desc())
        .limit(3)
    )
    top_staff = [{"name": r.name, "bookings": r.cnt} for r in top_staff_result]

    # Yangi foydalanuvchilar
    new_users = await db.scalar(
        select(func.count(User.id)).where(User.created_at >= from_dt)
    )

    return {
        "period": period,
        "total_bookings": total_bookings or 0,
        "revenue": float(revenue or 0),
        "cancelled": cancelled or 0,
        "new_users": new_users or 0,
        "busy_hours": busy_hours,
        "top_staff": top_staff,
    }


# ══════════════════════════════════════════════════════════════
# CRM — mijozlar
# ══════════════════════════════════════════════════════════════
@router.get("/crm/users")
async def get_crm_users(
    search: Optional[str] = None,
    limit: int = 30,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    from sqlalchemy.orm import selectinload
    from sqlalchemy import or_, ilike

    query = (
        select(User)
        .options(selectinload(User.loyalty))
        .order_by(User.created_at.desc())
        .limit(limit)
    )
    if search:
        query = query.where(
            or_(
                User.full_name.ilike(f"%{search}%"),
                User.username.ilike(f"%{search}%"),
                User.phone.ilike(f"%{search}%"),
            )
        )
    result = await db.execute(query)
    users = result.scalars().all()

    out = []
    for u in users:
        bk_count = await db.scalar(
            select(func.count(Booking.id)).where(
                and_(
                    Booking.user_id == u.id,
                    Booking.status == BookingStatus.confirmed,
                )
            )
        )
        total_spent = await db.scalar(
            select(func.sum(Payment.amount))
            .join(Booking)
            .where(
                and_(
                    Booking.user_id == u.id,
                    Payment.status == PaymentStatus.paid,
                )
            )
        )
        out.append({
            "id": u.id,
            "name": u.full_name,
            "username": u.username,
            "phone": u.phone,
            "bookings_count": bk_count or 0,
            "total_spent": float(total_spent or 0),
            "loyalty_count": u.loyalty.current_count if u.loyalty else 0,
            "joined": u.created_at.strftime("%d.%m.%Y"),
        })
    return out


@router.get("/crm/users/{user_id}")
async def get_crm_user_detail(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Bitta mijoz to'liq tarixi"""
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.loyalty))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    bk_result = await db.execute(
        select(Booking)
        .where(Booking.user_id == user_id)
        .options(
            selectinload(Booking.service),
            selectinload(Booking.staff),
        )
        .order_by(Booking.start_time.desc())
        .limit(20)
    )
    bookings = bk_result.scalars().all()

    # Sevimli xodim
    fav_staff = await db.execute(
        select(Staff.name, func.count(Booking.id).label("cnt"))
        .join(Booking, Booking.staff_id == Staff.id)
        .where(Booking.user_id == user_id)
        .group_by(Staff.name)
        .order_by(func.count(Booking.id).desc())
        .limit(1)
    )
    fav = fav_staff.first()

    return {
        "user": {
            "id": user.id,
            "name": user.full_name,
            "username": user.username,
            "phone": user.phone,
            "joined": user.created_at.strftime("%d.%m.%Y"),
        },
        "stats": {
            "total_bookings": len(bookings),
            "favourite_staff": fav.name if fav else None,
            "loyalty_progress": user.loyalty.current_count if user.loyalty else 0,
        },
        "bookings": [
            {
                "id": b.id,
                "service": b.service.name if b.service else "Paket",
                "staff": b.staff.name if b.staff else None,
                "date": b.start_time.strftime("%d.%m.%Y %H:%M"),
                "status": b.status.value,
                "price": float(b.total_price),
            }
            for b in bookings
        ],
    }
