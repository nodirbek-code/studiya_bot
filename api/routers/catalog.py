"""
Catalog Router — xizmatlar, paketlar, portfolio, xodimlar
Mini App uchun asosiy ma'lumotlar
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from core.database import get_db
from models.models import (
    Service, Package, PortfolioItem, Staff,
    Review, ReviewStatus, StudioInfo,
)
from schemas.catalog import (
    ServiceOut, PackageOut, PortfolioItemOut,
    StaffOut, StudioInfoOut, CatalogListOut,
)
from security.auth import get_current_user
from models.models import User

router = APIRouter()


# ══════════════════════════════════════════════════════════════
# STUDIO INFO
# ══════════════════════════════════════════════════════════════
@router.get("/info", response_model=StudioInfoOut)
async def get_studio_info(db: AsyncSession = Depends(get_db)):
    """Studiya haqida asosiy ma'lumot"""
    result = await db.execute(select(StudioInfo).limit(1))
    info = result.scalar_one_or_none()
    if not info:
        return StudioInfoOut(
            name="Studio",
            bio=None, phone=None, instagram=None,
            address=None, latitude=None, longitude=None,
            logo_url=None, cover_url=None,
            default_open_time=None, default_close_time=None,
        )
    return info


# ══════════════════════════════════════════════════════════════
# SERVICES — xizmatlar
# ══════════════════════════════════════════════════════════════
@router.get("/services", response_model=list[ServiceOut])
async def get_services(
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Service).where(Service.is_active == True).order_by(Service.sort_order)
    if category:
        query = query.where(Service.category == category)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/services/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Barcha mavjud kategoriyalar ro'yxati"""
    result = await db.execute(
        select(Service.category)
        .where(Service.is_active == True)
        .distinct()
    )
    return {"categories": [r[0] for r in result.all()]}


# ══════════════════════════════════════════════════════════════
# PACKAGES — paket xizmatlar
# ══════════════════════════════════════════════════════════════
@router.get("/packages", response_model=list[PackageOut])
async def get_packages(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Package)
        .where(Package.is_active == True)
        .order_by(Package.sort_order)
    )
    return result.scalars().all()


# ══════════════════════════════════════════════════════════════
# PORTFOLIO
# ══════════════════════════════════════════════════════════════
@router.get("/portfolio", response_model=list[PortfolioItemOut])
async def get_portfolio(
    category: Optional[str] = Query(None),
    staff_id: Optional[int] = Query(None),
    limit: int = Query(20, le=50),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(PortfolioItem)
        .where(PortfolioItem.is_active == True)
        .options(selectinload(PortfolioItem.service))
        .order_by(PortfolioItem.sort_order)
        .limit(limit)
        .offset(offset)
    )
    if staff_id:
        query = query.where(PortfolioItem.staff_id == staff_id)
    if category:
        query = query.join(Service).where(Service.category == category)

    result = await db.execute(query)
    return result.scalars().all()


# ══════════════════════════════════════════════════════════════
# STAFF — xodimlar
# ══════════════════════════════════════════════════════════════
@router.get("/staff", response_model=list[StaffOut])
async def get_staff(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Staff)
        .where(Staff.is_active == True)
        .order_by(Staff.sort_order)
    )
    staff_list = result.scalars().all()

    # Har bir xodim uchun o'rtacha reyting
    staff_out = []
    for member in staff_list:
        avg_result = await db.execute(
            select(func.avg(Review.rating))
            .join(Review.booking)
            .where(
                Review.status == ReviewStatus.approved,
                # booking.staff_id == member.id (join orqali)
            )
        )
        avg_rating = avg_result.scalar()
        staff_out.append(StaffOut(
            id=member.id,
            name=member.name,
            role=member.role,
            bio=member.bio,
            photo_url=member.photo_url,
            instagram=member.instagram,
            avg_rating=round(float(avg_rating), 1) if avg_rating else None,
        ))

    return staff_out


# ══════════════════════════════════════════════════════════════
# REVIEWS — tasdiqlangan sharhlar
# ══════════════════════════════════════════════════════════════
@router.get("/reviews")
async def get_approved_reviews(
    limit: int = Query(10, le=30),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Review)
        .where(Review.status == ReviewStatus.approved)
        .options(selectinload(Review.user))
        .order_by(Review.created_at.desc())
        .limit(limit)
    )
    reviews = result.scalars().all()
    return [
        {
            "id": r.id,
            "rating": r.rating,
            "text": r.text,
            "user_name": r.user.full_name,
            "created_at": r.created_at.isoformat(),
        }
        for r in reviews
    ]


@router.get("/stats")
async def get_public_stats(db: AsyncSession = Depends(get_db)):
    """Bosh sahifa uchun umumiy statistika"""
    staff_count = await db.scalar(
        select(func.count()).where(Staff.is_active == True)
    )
    service_count = await db.scalar(
        select(func.count()).where(Service.is_active == True)
    )
    avg_rating = await db.scalar(
        select(func.avg(Review.rating))
        .where(Review.status == ReviewStatus.approved)
    )
    review_count = await db.scalar(
        select(func.count()).where(Review.status == ReviewStatus.approved)
    )
    return {
        "staff_count": staff_count or 0,
        "service_count": service_count or 0,
        "avg_rating": round(float(avg_rating), 1) if avg_rating else 0,
        "review_count": review_count or 0,
    }
