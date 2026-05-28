"""
Broadcast Worker — barcha foydalanuvchilarga xabar yuborish
Asinxron, navbat bilan — bot bloklamas
"""
import asyncio
from celery.utils.log import get_task_logger
from core.celery_app import celery_app

logger = get_task_logger(__name__)


@celery_app.task(name="workers.broadcast.send_broadcast", bind=True, max_retries=2)
def send_broadcast(self, broadcast_id: int):
    try:
        asyncio.run(_do_broadcast(broadcast_id))
    except Exception as exc:
        logger.error(f"Broadcast {broadcast_id} failed: {exc}")
        raise self.retry(exc=exc, countdown=300)


async def _do_broadcast(broadcast_id: int):
    from core.database import AsyncSessionLocal
    from models.models import Broadcast, BroadcastTarget, User, Booking, BookingStatus
    from sqlalchemy import select, distinct
    from datetime import datetime
    import aiohttp
    from core.config import settings

    async with AsyncSessionLocal() as db:
        bc_result = await db.execute(
            select(Broadcast).where(Broadcast.id == broadcast_id)
        )
        broadcast = bc_result.scalar_one_or_none()
        if not broadcast or broadcast.is_sent:
            return

        # Kimga yuboriladi?
        if broadcast.target == BroadcastTarget.all:
            users_result = await db.execute(
                select(User.id).where(User.is_blocked == False)
            )
        else:
            # Faqat kamida 1 marta bron qilganlar
            users_result = await db.execute(
                select(distinct(Booking.user_id)).where(
                    Booking.status.in_([
                        BookingStatus.confirmed,
                        BookingStatus.completed,
                    ])
                )
            )

        user_ids = [row[0] for row in users_result.all()]
        logger.info(f"Broadcast {broadcast_id}: {len(user_ids)} ta foydalanuvchi")

        sent = 0
        failed = 0

        # Navbat bilan yuborish — Telegram rate limit (30 msg/sec)
        chunk_size = 25
        for i in range(0, len(user_ids), chunk_size):
            chunk = user_ids[i:i + chunk_size]
            payload = {
                "user_ids": chunk,
                "text": broadcast.message_text,
                "media_url": broadcast.media_url,
                "media_type": broadcast.media_type,
            }
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"http://bot:8001/broadcast/send-chunk",
                        json=payload,
                        headers={"X-Bot-Secret": settings.webhook_secret},
                        timeout=aiohttp.ClientTimeout(total=60),
                    ) as resp:
                        if resp.status == 200:
                            result = await resp.json()
                            sent += result.get("sent", 0)
                            failed += result.get("failed", 0)
            except Exception as e:
                logger.error(f"Chunk failed: {e}")
                failed += len(chunk)

            # Rate limit uchun kutish
            await asyncio.sleep(1)

        # Statistikani yangilash
        broadcast.sent_count = sent
        broadcast.failed_count = failed
        broadcast.is_sent = True
        broadcast.sent_at = datetime.utcnow()
        await db.commit()

        logger.info(f"Broadcast {broadcast_id} done: sent={sent}, failed={failed}")
