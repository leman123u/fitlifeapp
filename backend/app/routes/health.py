"""Health check for load balancers and monitoring."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def health_check():
    return {
        "status": "healthy",
        "service": "fitlife-pro-api",
    }
