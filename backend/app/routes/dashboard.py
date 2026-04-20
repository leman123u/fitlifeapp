"""Aggregated dashboard data for the mobile app home screen."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.connection import get_db
from app.deps.auth import get_current_user
from app.models.user import FitnessGoal, User
from app.schemas.dashboard import (
    DashboardSummaryOut,
    DietSummary,
    ExercisePreview,
    MacroGrams,
    StreakInfo,
    TodayWorkoutCard,
    WaterTapOut,
)
from app.services.progress_stats import compute_workout_streak, utc_today

router = APIRouter()

PROGRESS_COLLECTION = "progress"
MEAL_LOGS_COLLECTION = "meal_logs"
WATER_COLLECTION = "water_intake"


def _fitness_to_diet_goal(goal: FitnessGoal) -> str:
    return {
        FitnessGoal.LOSE_WEIGHT: "weight_loss",
        FitnessGoal.BUILD_MUSCLE: "muscle_gain",
        FitnessGoal.MAINTAIN: "maintenance",
    }[goal]


def _macro_targets_from_plan(plan: dict | None, calorie_goal: int) -> MacroGrams:
    if plan and plan.get("macros"):
        m = plan["macros"]
        return MacroGrams(
            protein=float(m["protein"]),
            carbs=float(m["carbs"]),
            fat=float(m["fat"]),
        )
    # Fallback split by calories (approximate)
    return MacroGrams(
        protein=round(calorie_goal * 0.3 / 4, 1),
        carbs=round(calorie_goal * 0.4 / 4, 1),
        fat=round(calorie_goal * 0.3 / 9, 1),
    )


def _estimate_consumed_macros(
    consumed_cal: int,
    targets: MacroGrams,
    calorie_goal: int,
) -> MacroGrams:
    """Split consumed kcal across macros using target gram ratios."""
    if consumed_cal <= 0 or calorie_goal <= 0:
        return MacroGrams(protein=0, carbs=0, fat=0)
    tp, tc, tf = targets.protein, targets.carbs, targets.fat
    target_cals = tp * 4 + tc * 4 + tf * 9
    if target_cals <= 0:
        return MacroGrams(protein=0, carbs=0, fat=0)
    scale = min(1.0, consumed_cal / calorie_goal)
    return MacroGrams(
        protein=round(tp * scale, 1),
        carbs=round(tc * scale, 1),
        fat=round(tf * scale, 1),
    )


@router.get("/summary", response_model=DashboardSummaryOut)
async def get_dashboard_summary(
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Today's workout preview, diet numbers, streak, and water — all in one call."""
    today = utc_today().isoformat()

    # --- Workout card ---
    wdoc = await db["workouts"].find_one({"gym_type": user.gym_type})
    if wdoc is None:
        wdoc = await db["workouts"].find_one({})
    today_workout: TodayWorkoutCard | None = None
    if wdoc:
        ex = (wdoc.get("exercises") or [])[:5]
        previews = [
            ExercisePreview(name=e.get("name", ""), sets=int(e.get("sets", 0)), reps=int(e.get("reps", 0)))
            for e in ex
        ]
        today_workout = TodayWorkoutCard(
            id=str(wdoc["_id"]),
            name=wdoc.get("name", "Workout"),
            gym_type=wdoc.get("gym_type", user.gym_type),
            duration_minutes=int(wdoc.get("duration_minutes", 0)),
            exercises_preview=previews,
        )

    # --- Meal calories today ---
    meal = await db[MEAL_LOGS_COLLECTION].find_one({"user_id": user.id, "date": today})
    calories_consumed = 0
    if meal and meal.get("entries"):
        for ent in meal["entries"]:
            calories_consumed += int(ent.get("calories") or 0)

    calorie_goal = int(user.calorie_goal)
    remaining = max(0, calorie_goal - calories_consumed)

    dg = _fitness_to_diet_goal(user.goal)
    plans = await db["diet_plans"].find({"goal_type": dg}).to_list(length=200)
    best_plan = None
    if plans:
        best_plan = min(plans, key=lambda p: abs(int(p.get("calorie_goal", 0)) - calorie_goal))
    targets = _macro_targets_from_plan(best_plan, calorie_goal)
    consumed_macros = _estimate_consumed_macros(calories_consumed, targets, calorie_goal)

    diet = DietSummary(
        calorie_goal=calorie_goal,
        calories_consumed=calories_consumed,
        calories_remaining=remaining,
        target_macros=targets,
        consumed_macros_estimate=consumed_macros,
    )

    # --- Streak ---
    cutoff = (utc_today() - timedelta(days=400)).isoformat()
    prog_docs = await db[PROGRESS_COLLECTION].find(
        {"user_id": user.id, "date": {"$gte": cutoff}}
    ).to_list(length=500)
    streak_days, anchor = compute_workout_streak(prog_docs)
    streak = StreakInfo(
        current_days=streak_days,
        last_workout_date=anchor.isoformat() if anchor else None,
    )

    # --- Water ---
    wrow = await db[WATER_COLLECTION].find_one({"user_id": user.id, "date": today})
    glasses = int(wrow.get("glasses", 0)) if wrow else 0

    return DashboardSummaryOut(
        display_name=user.name.split()[0] if user.name else "Athlete",
        gym_type=user.gym_type,
        today_workout=today_workout,
        diet=diet,
        streak=streak,
        water_glasses=glasses,
    )


@router.post("/water/tap", response_model=WaterTapOut)
async def tap_water_glass(
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Add one glass (8 oz) for today (UTC)."""
    today = utc_today().isoformat()
    coll = db[WATER_COLLECTION]
    await coll.update_one(
        {"user_id": user.id, "date": today},
        {"$inc": {"glasses": 1}, "$set": {"updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    doc = await coll.find_one({"user_id": user.id, "date": today})
    g = int(doc.get("glasses", 0)) if doc else 1
    return WaterTapOut(date=today, glasses=g, ok=True)
