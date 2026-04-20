"""API schemas for progress tracking."""

from __future__ import annotations

from datetime import date as date_type
from pydantic import BaseModel, Field


class ProgressCreateIn(BaseModel):
    """Upsert a daily progress row (UTC calendar date)."""

    date: date_type | None = Field(
        default=None,
        description="Defaults to today (UTC) if omitted",
    )
    weight: float | None = Field(default=None, ge=0, description="kg")
    calories_eaten: int = Field(default=0, ge=0)
    workout_completed: bool = False
    notes: str | None = None


class ProgressOut(BaseModel):
    id: str
    user_id: str
    date: str = Field(..., description="ISO date YYYY-MM-DD")
    weight: float | None = None
    calories_eaten: int = 0
    workout_completed: bool = False
    notes: str | None = None


class CaloriesTrendBlock(BaseModel):
    recent_7d_avg_kcal: float | None = None
    prior_7d_avg_kcal: float | None = None
    change_kcal: float | None = Field(
        default=None,
        description="recent_7d − prior_7d (negative means lower intake vs prior week)",
    )
    trend_label: str = Field(
        ...,
        description="up | down | stable | insufficient_data",
    )


class DeficitSurplusBlock(BaseModel):
    """Compares recent intake to an assumed daily target (for surplus/deficit wording)."""

    target_calories: int = Field(..., ge=0)
    avg_intake_7d_kcal: float | None = None
    estimated_daily_balance_kcal: float | None = Field(
        default=None,
        description="avg_intake_7d − target; negative ≈ deficit vs target",
    )


class ProgressSummaryOut(BaseModel):
    user_id: str
    window_days: int = Field(..., description="Rolling window used for consistency & weights")

    total_workouts_completed: int = Field(
        ...,
        description="Days with workout_completed in the window",
    )
    avg_daily_calories: float | None = Field(
        default=None,
        description="Mean calories_eaten over days with entries in window",
    )
    weight_change_kg: float | None = Field(
        default=None,
        description="Latest weight − earliest weight in window (both non-null)",
    )
    weekly_avg_weight_kg: float | None = Field(
        default=None,
        description="Mean of non-null weights in the last 7 UTC days",
    )
    workout_consistency_pct: float = Field(
        ...,
        ge=0,
        le=100,
        description="100 × (workout days in window) / window_days",
    )
    calories_trend: CaloriesTrendBlock
    deficit_surplus_hint: DeficitSurplusBlock


class StreakOut(BaseModel):
    user_id: str
    current_streak_days: int = Field(
        ...,
        description="Consecutive calendar days with workout_completed, ending at last logged workout day",
    )
    last_workout_date: str | None = Field(
        default=None,
        description="Most recent date (UTC) with workout_completed=True",
    )
