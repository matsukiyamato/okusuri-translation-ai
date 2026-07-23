from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """バックエンド全体で使用する環境設定。"""

    app_name: str = "お薬翻訳AI API"
    app_version: str = "0.1.0"
    app_env: str = "development"
    debug: bool = True

    cors_origins: list[str] = [
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ]

    gemini_api_key: str = Field(default="", repr=False)
    google_application_credentials: str = Field(default="", repr=False)

    sqlite_database_url: str = "sqlite:///./okusuri_translation.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """環境設定を1回だけ生成して再利用する。"""
    return Settings()


settings: Settings = get_settings()