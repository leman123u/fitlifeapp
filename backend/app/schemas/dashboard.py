"""Dashboard aggregate API responses."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ExercisePreview(BaseModel):
    name: str
    sets: int
    reps: int


class TodayWorkoutCard(BaseModel):
    id: str | None = None
    name: str
    gym_type: str
    duration_minutes: int
    exercises_preview: list[ExercisePreview] = Field(default_factory=list)


class MacroGrams(BaseModel):
    protein: float
    carbs: float
    fat: float


class DietSummary(BaseModel):
    calorie_goal: int
    calories_consumed: int
    calories_remaining: int
    target_macros: MacroGrams
    consumed_macros_estimate: MacroGrams


class StreakInfo(BaseModel):
    current_days: int
    last_workout_date: str | None = None


class DashboardSummaryOut(BaseModel):
    display_name: str
    gym_type: str
    today_workout: TodayWorkoutCard | None
    diet: DietSummary
    streak: StreakInfo
    water_glasses: int = Field(..., ge=0, description="Glasses logged today (8 oz each)")


class WaterTapOut(BaseModel):
    date: str
    glasses: int
    ok: bool = True
