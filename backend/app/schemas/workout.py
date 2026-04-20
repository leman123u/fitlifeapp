"""API schemas for workout endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.workout import WorkoutExercise


class WorkoutOut(BaseModel):
    """Workout plan returned from the API."""

    id: str
    name: str
    gym_type: str
    difficulty: str
    duration_minutes: int
    description: str = Field(default="", description="Optional overview shown in the app")
    exercises: list[WorkoutExercise]


class WorkoutCompleteIn(BaseModel):
    """Mark a workout finished for the current UTC calendar day."""

    workout_id: str = Field(
        ...,
        min_length=24,
        max_length=24,
        description="MongoDB ObjectId hex string of the workout plan",
    )


class WorkoutCompleteOut(BaseModel):
    ok: bool = True
    date: str = Field(..., description="UTC date ISO (YYYY-MM-DD)")
    workout_id: str
    message: str | None = None
