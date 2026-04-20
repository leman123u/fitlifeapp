"""API health route — no DB; safe for CI."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routes.health import router as health_router


def _app() -> FastAPI:
    app = FastAPI()
    app.include_router(health_router, prefix="/health")
    return app


def test_health_returns_ok() -> None:
    client = TestClient(_app())
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body.get("status") == "healthy"
    assert body.get("service") == "fitlife-pro-api"
