"""SQLAlchemyを使用したMySQL接続管理。"""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import URL, create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from config import settings


DATABASE_URL = URL.create(
    drivername="mysql+pymysql",
    username=settings.mysql_user,
    password=settings.mysql_password,
    host=settings.mysql_host,
    port=settings.mysql_port,
    database=settings.mysql_database,
    query={
        "charset": "utf8mb4",
    },
)


engine: Engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=settings.mysql_pool_size,
    max_overflow=settings.mysql_max_overflow,
    pool_recycle=settings.mysql_pool_recycle,
    connect_args={
        "connect_timeout": settings.mysql_connect_timeout,
    },
    echo=False,
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPIのDependency Injection用DBセッション。"""
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> dict[str, str | int]:
    """MySQLに接続し、SELECT 1を実行する。"""
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text(
                    """
                    SELECT
                        1 AS connection_ok,
                        DATABASE() AS database_name,
                        VERSION() AS mysql_version
                    """
                )
            ).mappings().one()

        return {
            "status": "ok",
            "connection_ok": int(result["connection_ok"]),
            "database_name": str(result["database_name"]),
            "mysql_version": str(result["mysql_version"]),
        }

    except SQLAlchemyError as exc:
        raise RuntimeError(
            "MySQLへの接続に失敗しました。"
            f"元のエラー: {type(exc).__name__}: {exc}"
        ) from exc