"""API route modules."""

from fastapi import APIRouter

from . import auth, dashboard, diet, progress, workouts

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(workouts.router, prefix="/workouts", tags=["workouts"])
api_router.include_router(diet.router, prefix="/diet", tags=["diet"])
api_router.include_router(progress.router, prefix="/progress", tags=["progress"])
