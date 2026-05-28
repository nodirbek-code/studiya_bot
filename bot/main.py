"""
Studio Booking Bot — asosiy ishga tushirish fayl
Polling yoki Webhook rejimida ishlashi mumkin
"""
import asyncio
import structlog
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.redis import RedisStorage
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from config import settings
from middlewares.auth import AdminCheckMiddleware
from middlewares.logging import LoggingMiddleware
from handlers.user import start, booking, profile
from handlers.admin import schedule, broadcast, reviews as admin_reviews, stats

logger = structlog.get_logger()


async def main():
    # ─── Bot va Dispatcher ────────────────────────────────
    bot = Bot(
        token=settings.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )

    # Redis'da FSM state saqlash — restart'dan keyin saqlanadi
    storage = RedisStorage.from_url(settings.redis_url)
    dp = Dispatcher(storage=storage)

    # ─── Middleware'lar (tartib muhim!) ───────────────────
    dp.message.middleware(LoggingMiddleware())
    dp.callback_query.middleware(LoggingMiddleware())
    dp.message.middleware(AdminCheckMiddleware())

    # ─── Router'lar ───────────────────────────────────────
    # User handlerlar
    dp.include_router(start.router)
    dp.include_router(booking.router)
    dp.include_router(profile.router)

    # Admin handlerlar
    dp.include_router(schedule.router)
    dp.include_router(broadcast.router)
    dp.include_router(admin_reviews.router)
    dp.include_router(stats.router)

    # ─── Bot ma'lumotlarini log ────────────────────────────
    bot_info = await bot.get_me()
    logger.info(
        "Bot started",
        username=bot_info.username,
        id=bot_info.id,
    )

    # ─── Polling (dev) yoki Webhook (prod) ────────────────
    try:
        await dp.start_polling(
            bot,
            allowed_updates=dp.resolve_used_update_types(),
            drop_pending_updates=True,  # Restart'da eski xabarlar o'tkazib yuboriladi
        )
    finally:
        await bot.session.close()
        logger.info("Bot stopped")


if __name__ == "__main__":
    asyncio.run(main())
