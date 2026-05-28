from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class BotSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    bot_token: str
    webhook_secret: str
    webhook_host: str
    admin_ids: str = ""

    database_url: str
    redis_url: str = "redis://redis:6379/0"

    # API base URL (bot API ga so'rov yuborish uchun)
    api_base_url: str = "http://api:8000"

    deposit_percent: int = 30
    booking_timeout_minutes: int = 10

    @property
    def admin_ids_list(self) -> List[int]:
        return [int(i.strip()) for i in self.admin_ids.split(",") if i.strip()]

    @property
    def mini_app_url(self) -> str:
        return self.webhook_host  # Mini App shu domendan serve qilinadi


@lru_cache
def get_settings() -> BotSettings:
    return BotSettings()


settings = get_settings()
