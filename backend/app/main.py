"""FitLife Pro API — FastAPI application entrypoint."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

_BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(_BACKEND_DIR / ".env")

from app.core.config import get_cors_origins
from app.core.errors import register_exception_handlers
from app.core.firebase_app import init_firebase, missing_credentials_ok_for_startup
from app.database.connection import close_db, connect_db, get_db, is_mock_db
from app.routes import api_router
from app.seed.diet_seed import seed_diet_plans_if_empty
from app.seed.workout_seed import seed_workouts_if_empty
from app.routes.health import router as health_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Connect MongoDB and initialize Firebase Admin once on startup."""
    init_firebase(allow_missing_credentials=missing_credentials_ok_for_startup())
    await connect_db()
    if is_mock_db():
        logger.info("Using in-memory DB (USE_MOCK_DB); MongoDB not connected")
    else:
        logger.info("MongoDB connected")
    await seed_workouts_if_empty(get_db())
    await seed_diet_plans_if_empty(get_db())
    yield
    await close_db()
    logger.info("Database connection closed")


app = FastAPI(
    title="FitLife Pro API",
    version="0.1.0",
    description="Backend for FitLife Pro — workouts, nutrition, and progress.",
    lifespan=lifespan,
)

register_exception_handlers(app)

# Always allow Vite dev server; merge with CORS_ORIGINS from .env (see get_cors_origins).
def _cors_allow_origins() -> list[str]:
    merged = [
        *get_cors_origins(),
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    seen: set[str] = set()
    out: list[str] = []
    for origin in merged:
        if origin and origin not in seen:
            seen.add(origin)
            out.append(origin)
    return out


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_allow_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Top-level health check (no /api prefix) — for proxies and uptime monitors
app.include_router(health_router, prefix="/health", tags=["health"])

app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "app": "FitLife Pro",
        "status": "ok",
        "docs": "/docs",
        "health": "/health",
    }
