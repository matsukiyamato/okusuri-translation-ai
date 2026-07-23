"""FastAPIアプリケーションのエントリーポイント。"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_database, dispose_database


logger: logging.Logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """FastAPIの起動処理と終了処理を管理する。"""
    create_database()
    logger.info("SQLite database initialization completed")

    yield

    dispose_database()
    logger.info("SQLite database resources disposed")


app = FastAPI(
    title=settings.app_name,
    description="お薬翻訳AIのバックエンドAPI",
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict[str, str]:
    """FastAPIサーバーの起動状態を返す。"""
    return {
        "message": "Okusuri Translation AI API is running",
        "status": "ok",
    }