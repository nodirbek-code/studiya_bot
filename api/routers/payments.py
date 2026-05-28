"""
Payments Router — Payme va Click integratsiya
Har ikki provider uchun webhook handler
"""
import hashlib
import hmac
import json
import uuid
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from core.config import settings
from core.database import get_db
from models.models import (
    Booking, BookingStatus, Payment,
    PaymentStatus, PaymentProvider,
)
from schemas.catalog import BookingOut
from security.auth import get_current_user
from security.rate_limit import limit_payment
from services.booking_service import BookingService
from models.models import User

router = APIRouter()


# ══════════════════════════════════════════════════════════════
# TO'LOV INITIALIZATSIYA — Mini App'dan chaqiriladi
# ══════════════════════════════════════════════════════════════
@router.post("/init/{booking_id}")
async def init_payment(
    booking_id: str,
    provider: str,  # "payme" yoki "click"
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    To'lovni boshlash — Payme yoki Click URL qaytaradi.
    Rate limiting: 1 soatda max 10 ta urinish.
    Idempotency key — bir bronni ikki marta to'lashdan saqlaydi.
    """
    await limit_payment(current_user.id)

    # Bronni tekshirish
    result = await db.execute(
        select(Booking).where(
            and_(
                Booking.id == booking_id,
                Booking.user_id == current_user.id,
                Booking.status == BookingStatus.pending_payment,
            )
        )
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bron topilmadi yoki to'lov kutilmayapti",
        )

    # Idempotency key — takror to'lovdan saqlash
    idempotency_key = f"{booking_id}:{provider}:{current_user.id}"

    # Mavjud payment tekshirish
    existing = await db.execute(
        select(Payment).where(Payment.idempotency_key == idempotency_key)
    )
    payment = existing.scalar_one_or_none()

    if not payment:
        payment = Payment(
            id=str(uuid.uuid4()),
            booking_id=booking_id,
            provider=PaymentProvider(provider),
            idempotency_key=idempotency_key,
            amount=booking.deposit_amount,
            status=PaymentStatus.waiting,
        )
        db.add(payment)
        await db.flush()

    # Provider URL generatsiya
    if provider == "payme":
        payment_url = _generate_payme_url(payment.id, booking.deposit_amount)
    elif provider == "click":
        payment_url = _generate_click_url(payment.id, booking.deposit_amount)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Noma'lum to'lov tizimi. 'payme' yoki 'click' tanlang",
        )

    await db.commit()
    return {
        "payment_id": payment.id,
        "payment_url": payment_url,
        "amount": float(booking.deposit_amount),
        "expires_in_minutes": settings.booking_timeout_minutes,
    }


# ══════════════════════════════════════════════════════════════
# PAYME WEBHOOK
# ══════════════════════════════════════════════════════════════
@router.post("/payme/webhook")
async def payme_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Payme JSON-RPC webhook.
    Payme doimiy so'raydi — idempotent bo'lishi shart.
    """
    # Basic Auth tekshiruvi
    _verify_payme_auth(request)

    body = await request.json()
    method = body.get("method")
    params = body.get("params", {})
    request_id = body.get("id")

    handlers = {
        "CheckPerformTransaction": _payme_check_perform,
        "CreateTransaction": _payme_create_transaction,
        "PerformTransaction": _payme_perform,
        "CancelTransaction": _payme_cancel,
        "CheckTransaction": _payme_check,
        "GetStatement": _payme_statement,
    }

    handler = handlers.get(method)
    if not handler:
        return {"error": {"code": -32601, "message": "Method not found"}, "id": request_id}

    result = await handler(params, db)
    return {"result": result, "id": request_id}


def _verify_payme_auth(request: Request):
    import base64
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Basic "):
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        decoded = base64.b64decode(auth[6:]).decode()
        _, key = decoded.split(":", 1)
        if not hmac.compare_digest(key, settings.payme_secret_key):
            raise HTTPException(status_code=401, detail="Invalid key")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid auth")


async def _payme_check_perform(params: dict, db: AsyncSession) -> dict:
    """To'lov mumkinmi tekshirish"""
    account = params.get("account", {})
    payment_id = account.get("payment_id")
    amount = params.get("amount", 0)  # tiyin

    result = await db.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()

    if not payment:
        return {"error": {"code": -31050, "message": "Payment topilmadi"}}

    # Summa tekshiruvi (Payme tiyin da yuboradi)
    expected_tiyin = int(payment.amount * 100)
    if abs(amount - expected_tiyin) > 1:  # 1 tiyin tolerance
        return {"error": {"code": -31001, "message": "Summa mos kelmaydi"}}

    return {"allow": True}


async def _payme_create_transaction(params: dict, db: AsyncSession) -> dict:
    account = params.get("account", {})
    payment_id = account.get("payment_id")
    payme_transaction_id = params.get("id")
    amount = params.get("amount", 0)
    create_time = params.get("time", 0)

    result = await db.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()

    if not payment:
        return {"error": {"code": -31050, "message": "Payment topilmadi"}}

    if payment.external_id and payment.external_id != payme_transaction_id:
        return {"error": {"code": -31050, "message": "Boshqa transaction mavjud"}}

    if not payment.external_id:
        payment.external_id = payme_transaction_id
        await db.commit()

    return {
        "create_time": create_time,
        "transaction": payment.id,
        "state": 1,
    }


async def _payme_perform(params: dict, db: AsyncSession) -> dict:
    """To'lov muvaffaqiyatli — bronni tasdiqlash"""
    payme_id = params.get("id")
    perform_time = params.get("perform_time", 0)

    result = await db.execute(
        select(Payment).where(Payment.external_id == payme_id)
    )
    payment = result.scalar_one_or_none()

    if not payment:
        return {"error": {"code": -31050, "message": "Transaction topilmadi"}}

    if payment.status == PaymentStatus.paid:
        return {"perform_time": perform_time, "transaction": payment.id, "state": 2}

    # Idempotency — bir marta bajarilamiz
    payment.status = PaymentStatus.paid
    payment.paid_at = datetime.utcnow()
    await db.flush()

    # Bronni tasdiqlash
    await BookingService.confirm_booking(db, payment.booking_id)
    await db.commit()

    return {"perform_time": perform_time, "transaction": payment.id, "state": 2}


async def _payme_cancel(params: dict, db: AsyncSession) -> dict:
    payme_id = params.get("id")
    reason = params.get("reason", 0)
    cancel_time = params.get("cancel_time", 0)

    result = await db.execute(
        select(Payment).where(Payment.external_id == payme_id)
    )
    payment = result.scalar_one_or_none()

    if not payment:
        return {"error": {"code": -31050, "message": "Transaction topilmadi"}}

    if payment.status != PaymentStatus.paid:
        payment.status = PaymentStatus.failed
        # Bronni ham bekor qilish
        bk_result = await db.execute(
            select(Booking).where(Booking.id == payment.booking_id)
        )
        booking = bk_result.scalar_one_or_none()
        if booking:
            booking.status = BookingStatus.cancelled
        await db.commit()

    return {"cancel_time": cancel_time, "transaction": payment.id, "state": -1}


async def _payme_check(params: dict, db: AsyncSession) -> dict:
    payme_id = params.get("id")
    result = await db.execute(
        select(Payment).where(Payment.external_id == payme_id)
    )
    payment = result.scalar_one_or_none()

    if not payment:
        return {"error": {"code": -31050, "message": "Topilmadi"}}

    state_map = {
        PaymentStatus.waiting: 1,
        PaymentStatus.paid: 2,
        PaymentStatus.failed: -1,
    }
    return {
        "create_time": int(payment.created_at.timestamp() * 1000),
        "perform_time": int(payment.paid_at.timestamp() * 1000) if payment.paid_at else 0,
        "cancel_time": 0,
        "transaction": payment.id,
        "state": state_map.get(payment.status, 1),
        "reason": None,
    }


async def _payme_statement(params: dict, db: AsyncSession) -> dict:
    return {"transactions": []}


# ══════════════════════════════════════════════════════════════
# CLICK WEBHOOK
# ══════════════════════════════════════════════════════════════
@router.post("/click/prepare")
async def click_prepare(request: Request, db: AsyncSession = Depends(get_db)):
    """Click Prepare — to'lovni tayyorlash"""
    form = await request.form()

    merchant_trans_id = form.get("merchant_trans_id")  # payment_id
    amount = Decimal(str(form.get("amount", 0)))
    click_trans_id = form.get("click_trans_id")
    sign_time = form.get("sign_time")
    sign_string = form.get("sign_string")

    # Imzo tekshiruvi
    expected_sign = hashlib.md5(
        f"{click_trans_id}{settings.click_service_id}{settings.click_secret_key}"
        f"{merchant_trans_id}{amount}{-1}{sign_time}".encode()
    ).hexdigest()

    if not hmac.compare_digest(sign_string or "", expected_sign):
        return {"error": -1, "error_note": "SIGN CHECK FAILED"}

    result = await db.execute(
        select(Payment).where(Payment.id == merchant_trans_id)
    )
    payment = result.scalar_one_or_none()

    if not payment:
        return {"error": -5, "error_note": "USER NOT FOUND"}

    if abs(payment.amount - amount) > Decimal("0.01"):
        return {"error": -2, "error_note": "INCORRECT PARAMETER AMOUNT"}

    payment.external_id = click_trans_id
    await db.commit()

    return {
        "click_trans_id": click_trans_id,
        "merchant_trans_id": merchant_trans_id,
        "merchant_prepare_id": payment.id,
        "error": 0,
        "error_note": "Success",
    }


@router.post("/click/complete")
async def click_complete(request: Request, db: AsyncSession = Depends(get_db)):
    """Click Complete — to'lovni yakunlash"""
    form = await request.form()

    merchant_trans_id = form.get("merchant_trans_id")
    merchant_prepare_id = form.get("merchant_prepare_id")
    click_trans_id = form.get("click_trans_id")
    error = int(form.get("error", 0))

    result = await db.execute(
        select(Payment).where(Payment.id == merchant_prepare_id)
    )
    payment = result.scalar_one_or_none()

    if not payment:
        return {"error": -6, "error_note": "Transaction not found"}

    if error < 0:
        # To'lov bekor qilindi
        payment.status = PaymentStatus.failed
        bk_result = await db.execute(
            select(Booking).where(Booking.id == payment.booking_id)
        )
        booking = bk_result.scalar_one_or_none()
        if booking:
            booking.status = BookingStatus.cancelled
    else:
        # Muvaffaqiyatli — idempotent
        if payment.status != PaymentStatus.paid:
            payment.status = PaymentStatus.paid
            payment.paid_at = datetime.utcnow()
            await db.flush()
            await BookingService.confirm_booking(db, payment.booking_id)

    await db.commit()

    return {
        "click_trans_id": click_trans_id,
        "merchant_trans_id": merchant_trans_id,
        "error": 0,
        "error_note": "Success",
    }


# ── URL generatsiya ────────────────────────────────────────────
def _generate_payme_url(payment_id: str, amount: Decimal) -> str:
    import base64
    merchant_id = settings.payme_merchant_id
    amount_tiyin = int(amount * 100)
    params = f"m={merchant_id};ac.payment_id={payment_id};a={amount_tiyin}"
    encoded = base64.b64encode(params.encode()).decode()
    base = "https://checkout.paycom.uz" if not settings.payme_test_mode else "https://test.paycom.uz"
    return f"{base}/{encoded}"


def _generate_click_url(payment_id: str, amount: Decimal) -> str:
    return (
        f"https://my.click.uz/services/pay"
        f"?service_id={settings.click_service_id}"
        f"&merchant_id={settings.click_merchant_id}"
        f"&amount={amount}"
        f"&transaction_param={payment_id}"
        f"&return_url={settings.webhook_host}"
    )
