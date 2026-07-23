"""複数のAPIで共通利用するPydanticスキーマ。"""

from typing import Literal

from pydantic import BaseModel, ConfigDict


class HealthCheckResponse(BaseModel):
    """APIとデータベースの稼働状態を表すレスポンス。"""

    model_config = ConfigDict(extra="forbid")

    status: Literal["ok", "degraded"]
    api: Literal["available"]
    database: Literal["available", "unavailable"]
    environment: str
    version: str