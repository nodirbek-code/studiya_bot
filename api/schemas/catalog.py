"""
Pydantic schemas — request/response validatsiya
"""
from datetime import time, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, computed_field


# ── Studio Info ────────────────────────────────────────────────
class StudioInfoOut(BaseModel):
    name: str
    bio: Optional[str]
    phone: Optional[str]
    instagram: Optional[str]
    address: Optional[str]
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    logo_url: Optional[str]
    cover_url: Optional[str]
    default_open_time: Optional[time]
    default_close_time: Optional[time]

    model_config = {"from_attributes": True}


# ── Service ────────────────────────────────────────────────────
class ServiceOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: str
    price_per_hour: Decimal
    min_duration_hours: int
    photo_url: Optional[str]

    model_config = {"from_attributes": True}


# ── Package ────────────────────────────────────────────────────
class PackageOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    original_price: Decimal
    discount_percent: int
    photo_url: Optional[str]

    @computed_field
    @property
    def final_price(self) -> Decimal:
        discount = self.original_price * Decimal(self.discount_percent) / 100
        return self.original_price - discount

    model_config = {"from_attributes": True}


# ── Staff ──────────────────────────────────────────────────────
class StaffOut(BaseModel):
    id: int
    name: str
    role: str
    bio: Optional[str]
    photo_url: Optional[str]
    instagram: Optional[str]
    avg_rating: Optional[float]

    model_config = {"from_attributes": True}


# ── Portfolio ──────────────────────────────────────────────────
class PortfolioItemOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    media_url: str
    media_type: str
    thumbnail_url: Optional[str]
    service_id: Optional[int]
    staff_id: Optional[int]

    model_config = {"from_attributes": True}


# ── Catalog List (barchasi bitta so'rovda) ─────────────────────
class CatalogListOut(BaseModel):
    services: list[ServiceOut]
    packages: list[PackageOut]
    staff: list[StaffOut]


# ── Booking ────────────────────────────────────────────────────
class BookingCreateIn(BaseModel):
    staff_id: Optional[int] = None
    service_id: Optional[int] = None
    package_id: Optional[int] = None
    start_time: datetime
    duration_hours: float = Field(ge=0.5, le=12)


class BookingOut(BaseModel):
    id: str
    user_id: int
    staff_id: Optional[int]
    service_id: Optional[int]
    package_id: Optional[int]
    start_time: datetime
    end_time: datetime
    duration_hours: Decimal
    total_price: Decimal
    deposit_amount: Decimal
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SlotCheck(BaseModel):
    date: str  # "2024-06-15"
    staff_id: Optional[int] = None


# ── Review ─────────────────────────────────────────────────────
class ReviewCreateIn(BaseModel):
    booking_id: str
    rating: int = Field(ge=1, le=5)
    text: Optional[str] = Field(None, max_length=1000)


class ReviewOut(BaseModel):
    id: int
    booking_id: str
    rating: int
    text: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Admin ──────────────────────────────────────────────────────
class ScheduleIn(BaseModel):
    date: str
    open_time: Optional[str] = None
    close_time: Optional[str] = None
    is_day_off: bool = False
    note: Optional[str] = None


class BroadcastIn(BaseModel):
    target: str = "all"
    message_text: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None


class LoyaltyConfigIn(BaseModel):
    is_active: bool = True
    bookings_required: int = Field(ge=1, le=100)
    reward_type: str
    reward_value: Decimal
    description: Optional[str] = None


class PackageCreateIn(BaseModel):
    name: str = Field(max_length=128)
    description: Optional[str] = None
    original_price: Decimal = Field(gt=0)
    discount_percent: int = Field(ge=0, le=100)
    photo_url: Optional[str] = None
    is_active: bool = True
