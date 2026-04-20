"""User document for MongoDB `users` collection."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from pydantic import BaseModel, ConfigDict, Field

from app.models.types import MongoIdStr


class FitnessGoal(StrEnum):
    """Training / body-composition goal."""

    LOSE_WEIGHT = "lose_weight"
    BUILD_MUSCLE = "build_muscle"
    MAINTAIN = "maintain"


class DietType(StrEnum):
    """Meal preference for planning."""

    STANDARD = "standard"
    VEGETARIAN = "vegetarian"
    HIGH_PROTEIN = "high_protein"
    KETO = "keto"


class User(BaseModel):
    """User profile stored in MongoDB."""

    model_config = ConfigDict(
        populate_by_name=True,
        str_strip_whitespace=True,
    )

    id: MongoIdStr = Field(..., description="MongoDB _id as hex string")
    firebase_uid: str = Field(..., description="Firebase Authentication UID (unique)")
    email: str = Field(..., description="User email")
    name: str = Field(..., description="Display name")
    age: int = Field(..., ge=0, le=130)
    weight: float = Field(..., ge=0, description="Body weight (kg)")
    height: float = Field(..., ge=0, description="Height (cm)")
    goal: FitnessGoal
    gym_type: str = Field(
        ...,
        description="e.g. bodybuilding, crossfit, yoga, home, calisthenics, swimming",
    )
    calorie_goal: int = Field(
        default=2000,
        ge=800,
        le=6000,
        description="Daily calorie target (kcal)",
    )
    diet_type: str = Field(
        default="standard",
        description="standard, vegetarian, high_protein, keto",
    )
    onboarding_completed: bool = Field(
        default=False,
        description="True after the user finishes the onboarding wizard",
    )
    created_at: datetime = Field(
        ...,
        description="UTC timestamp when the profile was created",
    )


# Backward-compatible alias for earlier code referencing UserDocument
UserDocument = User
