"""
Reviews Router — sharh yaratish va moderatsiya
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from core.database import get_db
from models.models import Review, ReviewStatus, Booking, BookingStatus, User
from schemas.catalog import ReviewCreateIn, ReviewOut
from security.auth import get_current_user, get_admin_user

router = APIRouter()


@router.post("", response_model=ReviewOut, status_code=201)
async def create_review(
    data: ReviewCreateIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Sharh qoldirish.
    Faqat bajarilgan bron uchun, faqat bir marta.
    Avval adminga ketadi (pending).
    """
    # Bron tekshirish — foydalanuvchining bajarilgan broni
    bk = await db.execute(
        select(Booking).where(
            and_(
                Booking.id == data.booking_id,
                Booking.user_id == current_user.id,
                Booking.status == BookingStatus.completed,
            )
        )
    )
    booking = bk.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Bron topilmadi yoki hali bajarilmagan")

    # Ikki marta sharh qoldirmaslik
    existing = await db.execute(
        select(Review).where(Review.booking_id == data.booking_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Bu bron uchun sharh allaqachon qoldirilgan")

    review = Review(
        booking_id=data.booking_id,
        user_id=current_user.id,
        rating=data.rating,
        text=data.text,
        status=ReviewStatus.pending,
    )
    db.add(review)
    await db.flush()

    # Adminga bildirishnoma
    from workers.reminders import notify_admin_new_booking
    from core.celery_app import celery_app
    celery_app.send_task(
        "workers.review_notify.notify_admin_review",
        args=[review.id],
    )

    await db.commit()
    return review


@router.get("/my", response_model=list[ReviewOut])
async def get_my_reviews(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Review)
        .where(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
    )
    return result.scalars().all()


# ── Admin: sharh tasdiqlash / rad etish ───────────────────────
@router.patch("/{review_id}/approve")
async def approve_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    review = await _get_review(db, review_id)
    review.status = ReviewStatus.approved
    review.moderated_at = datetime.utcnow()
    await db.commit()

    # Foydalanuvchiga xabar — sharhi tasdiqlandi
    from core.celery_app import celery_app
    celery_app.send_task("workers.review_notify.notify_user_review_approved", args=[review_id])

    return {"message": "Sharh tasdiqlandi"}


@router.patch("/{review_id}/reject")
async def reject_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    review = await _get_review(db, review_id)
    review.status = ReviewStatus.rejected
    review.moderated_at = datetime.utcnow()
    await db.commit()
    return {"message": "Sharh rad etildi"}


@router.get("/pending")
async def get_pending_reviews(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Admin: moderatsiya kutayotgan sharhlar"""
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Review)
        .where(Review.status == ReviewStatus.pending)
        .options(selectinload(Review.user), selectinload(Review.booking))
        .order_by(Review.created_at.asc())
    )
    reviews = result.scalars().all()
    return [
        {
            "id": r.id,
            "rating": r.rating,
            "text": r.text,
            "user_name": r.user.full_name,
            "booking_id": r.booking_id,
            "created_at": r.created_at.isoformat(),
        }
        for r in reviews
    ]


async def _get_review(db: AsyncSession, review_id: int) -> Review:
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Sharh topilmadi")
    return review
