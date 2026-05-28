"""
Telegram WebApp initData verifikatsiya
HMAC-SHA256 bilan — bu loyihaning xavfsizlik asosi
"""
import hashlib
import hmac
import json
import time
from urllib.parse import unquote, parse_qsl

from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.config import settings
from core.database import get_db
from models.models import User, UserRole


def verify_telegram_init_data(init_data: str) -> dict:
    """
    Telegram WebApp initData ni tekshiradi.

    Jarayon:
    1. init_data string'ni parse qilamiz
    2. 'hash' ni ajratib olamiz
    3. Qolgan maydonlarni alfavit tartibida saralab, \n bilan ulaymiz
    4. BOT_TOKEN dan HMAC-SHA256 kalit yasaymiz
    5. Data string'ni shu kalit bilan sign qilamiz
    6. Hosil bo'lgan hash va yuborilgan hash'ni taqqoslaymiz
    7. Vaqtni ham tekshiramiz — 5 daqiqadan eski rad etamiz
    """
    try:
        params = dict(parse_qsl(init_data, keep_blank_values=True))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="initData noto'g'ri format",
        )

    received_hash = params.pop("hash", None)
    if not received_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hash topilmadi",
        )

    # Vaqt tekshiruvi — 5 daqiqadan eski initData rad etiladi
    auth_date = int(params.get("auth_date", 0))
    if time.time() - auth_date > 300:  # 5 daqiqa
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="initData muddati o'tgan",
        )

    # Data string yasash — alfavit tartibida
    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(params.items())
    )

    # Secret key: HMAC-SHA256("WebAppData", BOT_TOKEN)
    secret_key = hmac.new(
        b"WebAppData",
        settings.bot_token.encode(),
        hashlib.sha256,
    ).digest()

    # Tekshirish
    computed_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="initData imzo noto'g'ri",
        )

    # user ma'lumotini parse qilamiz
    user_data = params.get("user", "{}")
    try:
        user_info = json.loads(unquote(user_data))
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ma'lumoti noto'g'ri",
        )

    return user_info


async def get_current_user(
    x_init_data: str = Header(..., alias="X-Init-Data"),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Header'dan initData oladi, tekshiradi, User qaytaradi.
    Foydalanuvchi yo'q bo'lsa — avtomatik yaratadi.
    """
    user_info = verify_telegram_init_data(x_init_data)

    telegram_id = user_info.get("id")
    if not telegram_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Telegram ID topilmadi",
        )

    result = await db.execute(
        select(User).where(User.id == telegram_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        # Yangi foydalanuvchi — avtomatik ro'yxatdan o'tkazish
        user = User(
            id=telegram_id,
            username=user_info.get("username"),
            full_name=f"{user_info.get('first_name', '')} {user_info.get('last_name', '')}".strip(),
            language_code=user_info.get("language_code"),
            role=UserRole.admin if telegram_id in settings.admin_ids_list else UserRole.user,
        )
        db.add(user)
        await db.flush()

    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Siz bloklandingiz",
        )

    return user


async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Faqat admin uchun — boshqalar 403 oladi"""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu amal faqat admin uchun",
        )
    return current_user


def verify_webhook_secret(secret: str) -> bool:
    """Telegram webhook secret token tekshiruvi"""
    return hmac.compare_digest(secret, settings.webhook_secret)
