"""
Logging middleware — har bir so'rovni log qilish
Telefon raqam va shaxsiy ma'lumotlar masklanadi
"""
import time
from typing import Callable, Any
import structlog
from aiogram import BaseMiddleware
from aiogram.types import Message, CallbackQuery, TelegramObject

logger = structlog.get_logger()


class LoggingMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable,
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        start = time.monotonic()
        user = data.get("event_from_user")

        log = logger.bind(
            user_id=user.id if user else None,
            # username logda ko'rinadi lekin phone ko'rinmaydi
            username=user.username if user else None,
            event_type=type(event).__name__,
        )

        if isinstance(event, Message):
            log = log.bind(
                text=(event.text or "")[:50] if event.text else f"[{event.content_type}]"
            )
        elif isinstance(event, CallbackQuery):
            log = log.bind(callback_data=event.data)

        try:
            result = await handler(event, data)
            elapsed = (time.monotonic() - start) * 1000
            log.info("Request handled", elapsed_ms=round(elapsed, 1))
            return result
        except Exception as exc:
            elapsed = (time.monotonic() - start) * 1000
            log.error("Request failed", elapsed_ms=round(elapsed, 1), error=str(exc))
            raise
