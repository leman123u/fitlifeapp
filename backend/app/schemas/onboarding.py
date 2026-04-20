"""Onboarding / profile completion payloads."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.user import DietType, FitnessGoal


class OnboardingIn(BaseModel):
    """Full profile from the 3-step onboarding wizard."""

    name: str = Field(..., min_length=1, max_length=120)
    age: int = Field(..., ge=13, le=120)
    weight: float = Field(..., ge=20, le=400, description="kg")
    height: float = Field(..., ge=80, le=250, description="cm")
    goal: FitnessGoal
    gym_type: str = Field(
        ...,
        description="bodybuilding | crossfit | yoga | home | calisthenics | swimming",
    )
    calorie_goal: int = Field(..., ge=1200, le=3500)
    diet_type: DietType
