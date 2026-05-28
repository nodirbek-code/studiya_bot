from celery import Celery
from celery.schedules import crontab
from core.config import settings

celery_app = Celery(
    "studio_booking",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "workers.reminders",
        "workers.payment_timeout",
        "workers.broadcast",
        "workers.review_request",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Tashkent",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,          # task crash bo'lsa qayta yuboriladi
    worker_prefetch_multiplier=1,  # fair distribution
)

# ─── Cron jadval ────────────────────────────────────────────
celery_app.conf.beat_schedule = {
    # Har kuni ertalab 8:00 da admin'ga jadval eslatmasi
    "daily-schedule-reminder": {
        "task": "workers.reminders.send_daily_schedule_reminder",
        "schedule": crontab(hour=8, minute=0),
    },
    # Har 30 daqiqada — jadval kiritilmagan bo'lsa qayta eslatma
    "schedule-followup-reminder": {
        "task": "workers.reminders.check_schedule_filled",
        "schedule": crontab(minute="*/30"),
    },
    # Har kuni kechqurun 21:00 — ertangi kunni eslatish
    "tomorrow-reminder": {
        "task": "workers.reminders.send_tomorrow_reminder",
        "schedule": crontab(hour=21, minute=0),
    },
}
