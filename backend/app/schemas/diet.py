"""API schemas for diet endpoints."""

from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, Field

from app.models.diet_plan import DietGoalType, DietMacros, DietMealsStructured


class DietPlanOut(BaseModel):
    """Full diet plan for API responses."""

    id: str
    name: str
    calorie_goal: int
    goal_type: DietGoalType
    meals: DietMealsStructured
    macros: DietMacros


class MealLogEntryIn(BaseModel):
    meal_slot: Literal["breakfast", "lunch", "dinner", "snack_1", "snack_2"]
    description: str = Field(..., min_length=1, description="What was eaten")
    calories: int | None = Field(default=None, ge=0, description="Estimated kcal for this entry")
    protein_g: float | None = Field(default=None, ge=0, description="Protein (g) for this entry")
    carbs_g: float | None = Field(default=None, ge=0, description="Carbs (g) for this entry")
    fat_g: float | None = Field(default=None, ge=0, description="Fat (g) for this entry")


class MealLogEntryOut(BaseModel):
    meal_slot: str
    description: str
    calories: int | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None


class TodayMealLogOut(BaseModel):
    date: str
    entries: list[MealLogEntryOut]
    notes: str = ""


class DietLogIn(BaseModel):
    """Replace or create today's meal log (UTC day)."""

    entries: list[MealLogEntryIn] = Field(
        default_factory=list,
        description="Meals eaten today; can be empty to clear notes-only logs",
    )
    notes: str = Field(default="", description="Optional day notes")


class DietLogOut(BaseModel):
    ok: bool = True
    date: str = Field(..., description="UTC date ISO (YYYY-MM-DD)")
    entry_count: int
    message: str | None = None
