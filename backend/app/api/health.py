"""アプリケーションの稼働状態を確認するAPI。"""

from fastapi import APIRouter, Response, status

from app.config import settings
from app.database import is_database_available
from app.schemas.common import HealthCheckResponse


router = APIRouter(
    prefix="/api",
    tags=["Health"],
)


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="APIとSQLiteの稼働状態を確認する",
)
def health_check(response: Response) -> HealthCheckResponse:
    """APIとSQLiteデータベースの稼働状態を返す。

    SQLiteへ接続できる場合はHTTP 200を返す。
    SQLiteへ接続できない場合はHTTP 503を返す。
    """
    database_available: bool = is_database_available()

    if not database_available:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

        return HealthCheckResponse(
            status="degraded",
            api="available",
            database="unavailable",
            environment=settings.app_env,
            version=settings.app_version,
        )

    return HealthCheckResponse(
        status="ok",
        api="available",
        database="available",
        environment=settings.app_env,
        version=settings.app_version,
    )