"""Diet plan documents for MongoDB `diet_plans` collection."""

from __future__ import annotations

from enum import StrEnum
from typing import List

from pydantic import BaseModel, ConfigDict, Field

from app.models.types import MongoIdStr


class DietGoalType(StrEnum):
    """High-level diet objective."""

    WEIGHT_LOSS = "weight_loss"
    MUSCLE_GAIN = "muscle_gain"
    MAINTENANCE = "maintenance"


class DietMacros(BaseModel):
    """Daily macro targets in grams."""

    model_config = ConfigDict(str_strip_whitespace=True)

    protein: float = Field(..., ge=0, description="Protein (g)")
    carbs: float = Field(..., ge=0, description="Carbohydrates (g)")
    fat: float = Field(..., ge=0, description="Fat (g)")


class PlannedMeal(BaseModel):
    """One meal slot with prep and shopping list."""

    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(..., description="Meal label, e.g. Greek Yogurt Bowl")
    prep_minutes: int = Field(..., ge=0, description="Active prep + cook time")
    ingredients: List[str] = Field(
        default_factory=list,
        description="Ingredient lines with rough amounts",
    )
    notes: str = Field(default="", description="Cooking or assembly tips")


class DietMealsStructured(BaseModel):
    """Full day: breakfast, lunch, dinner, two snacks."""

    model_config = ConfigDict(str_strip_whitespace=True)

    breakfast: PlannedMeal
    lunch: PlannedMeal
    dinner: PlannedMeal
    snack_1: PlannedMeal
    snack_2: PlannedMeal


class DietPlan(BaseModel):
    """Diet plan document."""

    model_config = ConfigDict(
        populate_by_name=True,
        str_strip_whitespace=True,
    )

    id: MongoIdStr = Field(..., description="MongoDB _id as hex string")
    name: str = Field(..., description="Plan name")
    calorie_goal: int = Field(..., ge=0, description="Daily calorie target (kcal)")
    goal_type: DietGoalType = Field(
        ...,
        description="weight_loss, muscle_gain, or maintenance",
    )
    meals: DietMealsStructured
    macros: DietMacros


# Legacy alias for older imports
DietMeals = DietMealsStructured
