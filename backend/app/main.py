from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.user import router as user_router


app = FastAPI(
    title="お薬翻訳AI API",
    version="0.1.0",
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(user_router)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "Okusuri Translation AI API",
    }