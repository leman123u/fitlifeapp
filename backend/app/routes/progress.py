"""User progress: daily entries, history, summary stats, workout streak."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.deps.auth import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.schemas.progress import (
    CaloriesTrendBlock,
    DeficitSurplusBlock,
    ProgressCreateIn,
    ProgressOut,
    ProgressSummaryOut,
    StreakOut,
)
from app.services.progress_stats import (
    calories_two_week_trend,
    compute_workout_streak,
    mean_non_null,
    parse_entry_date,
    trend_label,
    utc_today,
    weekly_avg_weight,
    weight_change_in_window,
    workout_consistency_pct,
)

router = APIRouter()

PROGRESS_COLLECTION = "progress"


def _assert_self(user_id: str, user: User) -> None:
    if user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own progress",
        )


def _normalize_date_value(raw: object) -> str:
    if isinstance(raw, datetime):
        return raw.date().isoformat()
    if isinstance(raw, date):
        return raw.isoformat()
    if isinstance(raw, str):
        return raw[:10]
    return str(raw)


def _doc_to_out(doc: dict) -> ProgressOut:
    d = dict(doc)
    d["id"] = str(d.pop("_id"))
    d["date"] = _normalize_date_value(d["date"])
    return ProgressOut.model_validate(d)


@router.post("", response_model=ProgressOut)
async def save_daily_progress(
    body: ProgressCreateIn,
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create or update the progress row for a calendar day (UTC)."""
    entry_date: date = body.date if body.date is not None else utc_today()
    date_str = entry_date.isoformat()

    coll = db[PROGRESS_COLLECTION]
    payload = {
        "user_id": user.id,
        "date": date_str,
        "weight": body.weight,
        "calories_eaten": body.calories_eaten,
        "workout_completed": body.workout_completed,
        "notes": body.notes,
        "updated_at": datetime.now(timezone.utc),
    }
    await coll.update_one(
        {"user_id": user.id, "date": date_str},
        {"$set": payload},
        upsert=True,
    )
    doc = await coll.find_one({"user_id": user.id, "date": date_str})
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to persist progress",
        )
    return _doc_to_out(doc)


@router.get("/{user_id}/summary", response_model=ProgressSummaryOut)
async def get_progress_summary(
    user_id: str,
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    window_days: int = Query(30, ge=7, le=366, description="Rolling window for stats"),
    target_calories: int = Query(
        2000,
        ge=800,
        le=6000,
        description="Assumed daily calorie target for surplus/deficit hint",
    ),
):
    _assert_self(user_id, user)

    today = utc_today()
    start = today - timedelta(days=window_days - 1)
    start_s = start.isoformat()
    end_s = today.isoformat()

    # Pull ≥21 days so 7d vs prior-7d calorie trend always has data when it exists
    wide_start_s = (today - timedelta(days=21)).isoformat()
    coll = db[PROGRESS_COLLECTION]
    cursor = coll.find(
        {"user_id": user_id, "date": {"$gte": wide_start_s, "$lte": end_s}}
    ).sort("date", 1)
    all_docs = await cursor.to_list(length=None)
    docs = [
        d
        for d in all_docs
        if start <= parse_entry_date(d["date"]) <= today
    ]

    workout_days = sum(1 for d in docs if d.get("workout_completed"))
    cal_vals = [int(d.get("calories_eaten") or 0) for d in docs]
    avg_cals = mean_non_null([float(x) for x in cal_vals]) if cal_vals else None

    w_change = weight_change_in_window(docs, start, today)
    w_week = weekly_avg_weight(all_docs, today, 7)

    r7, p7, ch = calories_two_week_trend(all_docs, today)
    ct = CaloriesTrendBlock(
        recent_7d_avg_kcal=r7,
        prior_7d_avg_kcal=p7,
        change_kcal=ch,
        trend_label=trend_label(ch),
    )

    # 7-day average intake for deficit hint (reuse recent_7d)
    ds = DeficitSurplusBlock(
        target_calories=target_calories,
        avg_intake_7d_kcal=r7,
        estimated_daily_balance_kcal=(r7 - target_calories) if r7 is not None else None,
    )

    return ProgressSummaryOut(
        user_id=user_id,
        window_days=window_days,
        total_workouts_completed=workout_days,
        avg_daily_calories=avg_cals,
        weight_change_kg=w_change,
        weekly_avg_weight_kg=w_week,
        workout_consistency_pct=workout_consistency_pct(window_days, workout_days),
        calories_trend=ct,
        deficit_surplus_hint=ds,
    )


@router.get("/{user_id}/streak", response_model=StreakOut)
async def get_workout_streak(
    user_id: str,
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Current consecutive workout-day streak (UTC dates)."""
    _assert_self(user_id, user)

    # Limit scan for performance; streaks beyond ~1y are rare
    cutoff = (utc_today() - timedelta(days=400)).isoformat()
    coll = db[PROGRESS_COLLECTION]
    cursor = coll.find({"user_id": user_id, "date": {"$gte": cutoff}})
    docs = await cursor.to_list(length=None)

    streak, anchor = compute_workout_streak(docs)
    last_str = anchor.isoformat() if anchor else None
    return StreakOut(
        user_id=user_id,
        current_streak_days=streak,
        last_workout_date=last_str,
    )


@router.get("/{user_id}", response_model=list[ProgressOut])
async def get_progress_history(
    user_id: str,
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """All progress entries for the user, newest first."""
    _assert_self(user_id, user)

    coll = db[PROGRESS_COLLECTION]
    cursor = coll.find({"user_id": user_id}).sort("date", -1)
    docs = await cursor.to_list(length=None)
    return [_doc_to_out(d) for d in docs]
