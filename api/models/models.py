"""
Studio Booking — barcha SQLAlchemy modellari
14 ta jadval, to'liq munosabatlar bilan
"""
import enum
from datetime import datetime, date, time
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    BigInteger, Boolean, Date, DateTime, Enum, ForeignKey,
    Integer, Numeric, String, Text, Time, UniqueConstraint,
    Index, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from models.base import TimestampMixin, gen_uuid


# ─── Enumlar ──────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"
    staff = "staff"


class BookingStatus(str, enum.Enum):
    pending_payment = "pending_payment"  # to'lov kutilmoqda
    confirmed = "confirmed"              # tasdiqlangan
    cancelled = "cancelled"              # bekor qilingan
    completed = "completed"              # bajarildi
    no_show = "no_show"                  # kelmadi


class PaymentStatus(str, enum.Enum):
    waiting = "waiting"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"


class PaymentProvider(str, enum.Enum):
    payme = "payme"
    click = "click"
    cash = "cash"


class ReviewStatus(str, enum.Enum):
    pending = "pending"      # admin ko'rishi kutilmoqda
    approved = "approved"    # tasdiqlangan, portfolio'da ko'rinadi
    rejected = "rejected"    # rad etilgan


class RewardType(str, enum.Enum):
    discount_percent = "discount_percent"
    free_hour = "free_hour"
    fixed_discount = "fixed_discount"


class BroadcastTarget(str, enum.Enum):
    all = "all"
    booked_users = "booked_users"  # kamida 1 bron qilganlar


# ══════════════════════════════════════════════════════════════
# 1. USERS
# ══════════════════════════════════════════════════════════════
class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)  # telegram_id
    username: Mapped[Optional[str]] = mapped_column(String(64))
    full_name: Mapped[str] = mapped_column(String(128))
    phone: Mapped[Optional[str]] = mapped_column(String(20))       # encrypted
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.user, nullable=False
    )
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False)
    language_code: Mapped[Optional[str]] = mapped_column(String(8))

    # Relationships
    bookings: Mapped[List["Booking"]] = relationship(back_populates="user")
    reviews: Mapped[List["Review"]] = relationship(back_populates="user")
    loyalty: Mapped[Optional["LoyaltyProgress"]] = relationship(
        back_populates="user", uselist=False
    )


# ══════════════════════════════════════════════════════════════
# 2. STAFF (xodimlar)
# ══════════════════════════════════════════════════════════════
class Staff(Base, TimestampMixin):
    __tablename__ = "staff"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128))
    role: Mapped[str] = mapped_column(String(64))        # "Fotograf", "Operator"
    bio: Mapped[Optional[str]] = mapped_column(Text)
    photo_url: Mapped[Optional[str]] = mapped_column(String(512))
    instagram: Mapped[Optional[str]] = mapped_column(String(128))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    bookings: Mapped[List["Booking"]] = relationship(back_populates="staff")


# ══════════════════════════════════════════════════════════════
# 3. SERVICES (xizmatlar)
# ══════════════════════════════════════════════════════════════
class Service(Base, TimestampMixin):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(64))    # "Portret", "Video"
    price_per_hour: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    min_duration_hours: Mapped[int] = mapped_column(Integer, default=1)
    photo_url: Mapped[Optional[str]] = mapped_column(String(512))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    bookings: Mapped[List["Booking"]] = relationship(back_populates="service")
    portfolio_items: Mapped[List["PortfolioItem"]] = relationship(
        back_populates="service"
    )


# ══════════════════════════════════════════════════════════════
# 4. PACKAGES (paket xizmatlar)
# ══════════════════════════════════════════════════════════════
class Package(Base, TimestampMixin):
    __tablename__ = "packages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[Optional[str]] = mapped_column(Text)
    original_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    discount_percent: Mapped[int] = mapped_column(Integer, default=0)
    photo_url: Mapped[Optional[str]] = mapped_column(String(512))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    @property
    def final_price(self) -> Decimal:
        discount = self.original_price * Decimal(self.discount_percent) / 100
        return self.original_price - discount

    bookings: Mapped[List["Booking"]] = relationship(back_populates="package")


# ══════════════════════════════════════════════════════════════
# 5. PORTFOLIO ITEMS
# ══════════════════════════════════════════════════════════════
class PortfolioItem(Base, TimestampMixin):
    __tablename__ = "portfolio_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(128))
    description: Mapped[Optional[str]] = mapped_column(Text)
    media_url: Mapped[str] = mapped_column(String(512))
    media_type: Mapped[str] = mapped_column(String(16))  # "photo", "video"
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(512))
    service_id: Mapped[Optional[int]] = mapped_column(ForeignKey("services.id"))
    staff_id: Mapped[Optional[int]] = mapped_column(ForeignKey("staff.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    service: Mapped[Optional["Service"]] = relationship(back_populates="portfolio_items")


# ══════════════════════════════════════════════════════════════
# 6. SCHEDULES (admin kunlik ish vaqti)
# ══════════════════════════════════════════════════════════════
class Schedule(Base):
    __tablename__ = "schedules"
    __table_args__ = (
        UniqueConstraint("date", name="uq_schedule_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    open_time: Mapped[Optional[time]] = mapped_column(Time)
    close_time: Mapped[Optional[time]] = mapped_column(Time)
    is_day_off: Mapped[bool] = mapped_column(Boolean, default=False)
    note: Mapped[Optional[str]] = mapped_column(String(256))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ══════════════════════════════════════════════════════════════
# 7. BOOKINGS (asosiy jadval)
# ══════════════════════════════════════════════════════════════
class Booking(Base, TimestampMixin):
    __tablename__ = "bookings"
    __table_args__ = (
        Index("ix_booking_start_time", "start_time"),
        Index("ix_booking_staff_date", "staff_id", "start_time"),
        Index("ix_booking_status", "status"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=gen_uuid
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=False
    )
    staff_id: Mapped[Optional[int]] = mapped_column(ForeignKey("staff.id"))
    service_id: Mapped[Optional[int]] = mapped_column(ForeignKey("services.id"))
    package_id: Mapped[Optional[int]] = mapped_column(ForeignKey("packages.id"))

    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    duration_hours: Mapped[Decimal] = mapped_column(Numeric(4, 2))

    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    deposit_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))

    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus),
        default=BookingStatus.pending_payment,
        nullable=False,
    )

    # Race condition himoyasi uchun — qachon lock qilingan
    locked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Admin eslatma yuborilganmi
    admin_notified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Reminder yuborilganmi (1 kun, 2 soat)
    reminder_1d_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    reminder_2h_sent: Mapped[bool] = mapped_column(Boolean, default=False)

    # Sharh so'raldi
    review_requested: Mapped[bool] = mapped_column(Boolean, default=False)

    notes: Mapped[Optional[str]] = mapped_column(Text)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="bookings")
    staff: Mapped[Optional["Staff"]] = relationship(back_populates="bookings")
    service: Mapped[Optional["Service"]] = relationship(back_populates="bookings")
    package: Mapped[Optional["Package"]] = relationship(back_populates="bookings")
    payments: Mapped[List["Payment"]] = relationship(back_populates="booking")
    review: Mapped[Optional["Review"]] = relationship(
        back_populates="booking", uselist=False
    )


# ══════════════════════════════════════════════════════════════
# 8. PAYMENTS
# ══════════════════════════════════════════════════════════════
class Payment(Base, TimestampMixin):
    __tablename__ = "payments"
    __table_args__ = (
        UniqueConstraint("external_id", "provider", name="uq_payment_external"),
        UniqueConstraint("idempotency_key", name="uq_payment_idempotency"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=gen_uuid
    )
    booking_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("bookings.id"), nullable=False
    )
    provider: Mapped[PaymentProvider] = mapped_column(
        Enum(PaymentProvider), nullable=False
    )
    external_id: Mapped[Optional[str]] = mapped_column(String(256))
    idempotency_key: Mapped[str] = mapped_column(String(256), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), default=PaymentStatus.waiting
    )
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    raw_response: Mapped[Optional[str]] = mapped_column(Text)  # JSON log

    booking: Mapped["Booking"] = relationship(back_populates="payments")


# ══════════════════════════════════════════════════════════════
# 9. REVIEWS
# ══════════════════════════════════════════════════════════════
class Review(Base, TimestampMixin):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("booking_id", name="uq_review_booking"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    booking_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("bookings.id"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=False
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    text: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[ReviewStatus] = mapped_column(
        Enum(ReviewStatus), default=ReviewStatus.pending
    )
    moderated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    booking: Mapped["Booking"] = relationship(back_populates="review")
    user: Mapped["User"] = relationship(back_populates="reviews")


# ══════════════════════════════════════════════════════════════
# 10. LOYALTY CONFIG (admin sozlaydi)
# ══════════════════════════════════════════════════════════════
class LoyaltyConfig(Base):
    __tablename__ = "loyalty_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    bookings_required: Mapped[int] = mapped_column(Integer, default=5)
    reward_type: Mapped[RewardType] = mapped_column(
        Enum(RewardType), default=RewardType.free_hour
    )
    reward_value: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=1)
    description: Mapped[Optional[str]] = mapped_column(String(256))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ══════════════════════════════════════════════════════════════
# 11. LOYALTY PROGRESS (har bir foydalanuvchi)
# ══════════════════════════════════════════════════════════════
class LoyaltyProgress(Base):
    __tablename__ = "loyalty_progress"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_loyalty_user"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=False
    )
    current_count: Mapped[int] = mapped_column(Integer, default=0)
    total_bookings: Mapped[int] = mapped_column(Integer, default=0)
    redeemed_count: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship(back_populates="loyalty")


# ══════════════════════════════════════════════════════════════
# 12. STUDIO INFO (studiya haqida ma'lumot)
# ══════════════════════════════════════════════════════════════
class StudioInfo(Base):
    __tablename__ = "studio_info"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128))
    bio: Mapped[Optional[str]] = mapped_column(Text)
    phone: Mapped[Optional[str]] = mapped_column(String(32))
    instagram: Mapped[Optional[str]] = mapped_column(String(128))
    address: Mapped[Optional[str]] = mapped_column(String(256))
    latitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7))
    logo_url: Mapped[Optional[str]] = mapped_column(String(512))
    cover_url: Mapped[Optional[str]] = mapped_column(String(512))
    default_open_time: Mapped[Optional[time]] = mapped_column(Time)
    default_close_time: Mapped[Optional[time]] = mapped_column(Time)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ══════════════════════════════════════════════════════════════
# 13. BROADCASTS (admin xabarlari)
# ══════════════════════════════════════════════════════════════
class Broadcast(Base, TimestampMixin):
    __tablename__ = "broadcasts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    admin_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"))
    target: Mapped[BroadcastTarget] = mapped_column(
        Enum(BroadcastTarget), default=BroadcastTarget.all
    )
    message_text: Mapped[Optional[str]] = mapped_column(Text)
    media_url: Mapped[Optional[str]] = mapped_column(String(512))
    media_type: Mapped[Optional[str]] = mapped_column(String(16))  # photo/video/gif
    sent_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)
    is_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


# ══════════════════════════════════════════════════════════════
# 14. SCHEDULE REMINDER STATE (admin kiritdimi?)
# ══════════════════════════════════════════════════════════════
class ScheduleReminderState(Base):
    __tablename__ = "schedule_reminder_state"
    __table_args__ = (
        UniqueConstraint("date", name="uq_reminder_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    is_filled: Mapped[bool] = mapped_column(Boolean, default=False)
    reminder_count: Mapped[int] = mapped_column(Integer, default=0)
    last_reminded_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
