"""Domain / document models (MongoDB collections)."""

from app.models.types import MongoIdStr, ProgressDateStr, PyObjectId
from app.models.diet_plan import (
    DietGoalType,
    DietMacros,
    DietMeals,
    DietMealsStructured,
    DietPlan,
    PlannedMeal,
)
from app.models.progress import Progress
from app.models.user import DietType, FitnessGoal, User, UserDocument
from app.models.workout import Workout, WorkoutExercise

__all__ = [
    "MongoIdStr",
    "ProgressDateStr",
    "PyObjectId",
    "DietGoalType",
    "DietMacros",
    "DietMeals",
    "DietMealsStructured",
    "DietPlan",
    "PlannedMeal",
    "DietType",
    "FitnessGoal",
    "Progress",
    "User",
    "UserDocument",
    "Workout",
    "WorkoutExercise",
]
