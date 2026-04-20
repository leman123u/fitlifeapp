"""API schemas for user-related endpoints."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.user import FitnessGoal


class UserOut(BaseModel):
    """User profile returned to the client (no internal ids like firebase_uid)."""

    id: str = Field(..., description="MongoDB document id")
    email: str
    name: str
    age: int
    weight: float = Field(..., description="kg")
    height: float = Field(..., description="cm")
    goal: FitnessGoal
    gym_type: str
    calorie_goal: int = 2000
    diet_type: str = "standard"
    onboarding_completed: bool = False
    created_at: datetime
