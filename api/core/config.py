from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ─── Telegram ─────────────────────────────────────────
    bot_token: str
    webhook_secret: str
    webhook_host: str
    admin_ids: str = ""  # "123,456" formatida

    @property
    def admin_ids_list(self) -> List[int]:
        return [int(i.strip()) for i in self.admin_ids.split(",") if i.strip()]

    # ─── Database ─────────────────────────────────────────
    database_url: str
    postgres_user: str = "studio_user"
    postgres_password: str = ""
    postgres_db: str = "studio_booking"

    # ─── Redis ────────────────────────────────────────────
    redis_url: str = "redis://redis:6379/0"
    celery_broker_url: str = "redis://redis:6379/1"
    celery_result_backend: str = "redis://redis:6379/2"

    # ─── Payment ──────────────────────────────────────────
    payme_merchant_id: str = ""
    payme_secret_key: str = ""
    payme_test_mode: bool = True

    click_service_id: str = ""
    click_merchant_id: str = ""
    click_secret_key: str = ""

    # ─── App ──────────────────────────────────────────────
    app_secret_key: str
    debug: bool = False
    environment: str = "production"

    # ─── Business logic ───────────────────────────────────
    deposit_percent: int = 30
    booking_timeout_minutes: int = 10


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
