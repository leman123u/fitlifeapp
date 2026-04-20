"""Application configuration from environment variables."""

from __future__ import annotations

import os


def get_cors_origins() -> list[str]:
    """
    Allowed browser origins for CORS.

    Set `CORS_ORIGINS` to a comma-separated list to override entirely, e.g.:
    `http://localhost:3000,https://app.example.com`

    If unset, defaults to `http://localhost:3000` plus `CLOUDFLARE_FRONTEND_URL` when set.
    """
    raw = os.environ.get("CORS_ORIGINS", "").strip()
    if raw:
        return [o.strip() for o in raw.split(",") if o.strip()]
    origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    cf = os.environ.get("CLOUDFLARE_FRONTEND_URL", "").strip()
    if cf:
        origins.append(cf)
    return origins


def is_production() -> bool:
    return os.environ.get("ENVIRONMENT", "development").lower() in (
        "production",
        "prod",
    )
