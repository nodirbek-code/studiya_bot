"""
Admin tekshiruv middleware
Admin buyruqlari faqat ro'yxatdagi IDs uchun
"""
from typing import Callable, Any
from aiogram import BaseMiddleware
from aiogram.types import Message, TelegramObject

from config import settings


class AdminCheckMiddleware(BaseMiddleware):
    """
    Har bir xabarga qo'shimcha ma'lumot qo'shadi:
    - is_admin: True/False
    Bu middlewareni handler'larda ishlatish uchun:
        async def handler(message, is_admin: bool)
    """

    async def __call__(
        self,
        handler: Callable,
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        user = data.get("event_from_user")
        if user:
            data["is_admin"] = user.id in settings.admin_ids_list
        else:
            data["is_admin"] = False

        return await handler(event, data)
