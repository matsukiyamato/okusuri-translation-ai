"""アプリケーション設定を管理するモジュール。"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parent
ENV_FILE = BACKEND_DIR / ".env"

load_dotenv(dotenv_path=ENV_FILE)


def get_required_env(name: str) -> str:
    """必須の環境変数を取得する。"""
    value = os.getenv(name)

    if value is None or not value.strip():
        raise RuntimeError(
            f"必須の環境変数が設定されていません: {name}"
        )

    return value.strip()


def get_int_env(
    name: str,
    default: int,
    minimum: int = 0,
) -> int:
    """整数形式の環境変数を取得する。"""
    raw_value = os.getenv(name, str(default))

    try:
        value = int(raw_value)
    except ValueError as exc:
        raise RuntimeError(
            f"{name}には整数を設定してください: {raw_value!r}"
        ) from exc

    if value < minimum:
        raise RuntimeError(
            f"{name}には{minimum}以上の値を設定してください"
        )

    return value


@dataclass(frozen=True)
class Settings:
    """アプリケーション設定。"""

    app_env: str

    mysql_host: str
    mysql_port: int
    mysql_database: str
    mysql_user: str
    mysql_password: str

    mysql_pool_size: int
    mysql_max_overflow: int
    mysql_pool_recycle: int
    mysql_connect_timeout: int


settings = Settings(
    app_env=os.getenv("APP_ENV", "development"),
    mysql_host=get_required_env("MYSQL_HOST"),
    mysql_port=get_int_env(
        "MYSQL_PORT",
        default=3306,
        minimum=1,
    ),
    mysql_database=get_required_env("MYSQL_DATABASE"),
    mysql_user=get_required_env("MYSQL_USER"),
    mysql_password=get_required_env("MYSQL_PASSWORD"),
    mysql_pool_size=get_int_env(
        "MYSQL_POOL_SIZE",
        default=5,
        minimum=1,
    ),
    mysql_max_overflow=get_int_env(
        "MYSQL_MAX_OVERFLOW",
        default=5,
        minimum=0,
    ),
    mysql_pool_recycle=get_int_env(
        "MYSQL_POOL_RECYCLE",
        default=1800,
        minimum=1,
    ),
    mysql_connect_timeout=get_int_env(
        "MYSQL_CONNECT_TIMEOUT",
        default=10,
        minimum=1,
    ),
)