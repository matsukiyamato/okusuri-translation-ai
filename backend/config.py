from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = Field(default="development", alias="APP_ENV")

    mysql_host: str = Field(default="127.0.0.1", alias="MYSQL_HOST")
    mysql_port: int = Field(default=3306, alias="MYSQL_PORT")
    mysql_database: str = Field(alias="MYSQL_DATABASE")
    mysql_user: str = Field(alias="MYSQL_USER")
    mysql_password: str = Field(alias="MYSQL_PASSWORD")

    mysql_pool_size: int = Field(default=5, alias="MYSQL_POOL_SIZE")
    mysql_max_overflow: int = Field(
        default=5,
        alias="MYSQL_MAX_OVERFLOW",
    )
    mysql_pool_recycle: int = Field(
        default=1800,
        alias="MYSQL_POOL_RECYCLE",
    )
    mysql_connect_timeout: int = Field(
        default=10,
        alias="MYSQL_CONNECT_TIMEOUT",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()