from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.dependencies.database import DatabaseSession


router = APIRouter(
    prefix="/api/v1/health",
    tags=["health"],
)


@router.get("/database")
def database_health(
    db: DatabaseSession,
) -> dict[str, str]:
    try:
        db.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "database": "connected",
        }

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Database connection unavailable",
        ) from exc