"""Workout plan documents for MongoDB `workouts` collection."""

from __future__ import annotations

from typing import List

from pydantic import BaseModel, ConfigDict, Field

from app.models.types import MongoIdStr


class WorkoutExercise(BaseModel):
    """Single exercise within a workout plan."""

    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(..., description="Exercise name")
    sets: int = Field(..., ge=1)
    reps: int = Field(..., ge=0, description="Reps per set (use 0 for time-based if needed)")
    rest_seconds: int = Field(..., ge=0, description="Rest between sets")
    description: str = Field(default="", description="Form cues or notes")
    muscle_group: str = Field(..., description="Primary muscle group, e.g. chest, legs")


class Workout(BaseModel):
    """Workout plan document."""

    model_config = ConfigDict(
        populate_by_name=True,
        str_strip_whitespace=True,
    )

    id: MongoIdStr = Field(..., description="MongoDB _id as hex string")
    name: str = Field(..., description="Workout title")
    gym_type: str = Field(
        ...,
        description="Matches app gym type (Bodybuilding, CrossFit, etc.)",
    )
    difficulty: str = Field(
        ...,
        description="e.g. beginner, intermediate, advanced",
    )
    duration_minutes: int = Field(..., ge=0, description="Estimated duration")
    description: str = Field(default="", description="Optional workout overview for the app")
    exercises: List[WorkoutExercise] = Field(
        default_factory=list,
        description="Ordered list of exercises",
    )
