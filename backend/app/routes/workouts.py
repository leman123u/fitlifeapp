"""Workout plans: list, filter by gym type, detail, and daily completion."""

from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from app.deps.auth import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.schemas.workout import WorkoutCompleteIn, WorkoutCompleteOut, WorkoutOut

router = APIRouter()

ALLOWED_GYM_TYPES = frozenset(
    {
        "bodybuilding",
        "crossfit",
        "yoga",
        "home",
        "calisthenics",
        "swimming",
    }
)


def _doc_to_out(doc: dict) -> WorkoutOut:
    d = dict(doc)
    d["id"] = str(d.pop("_id"))
    return WorkoutOut.model_validate(d)


def _parse_workout_oid(workout_id: str) -> ObjectId:
    try:
        return ObjectId(workout_id)
    except InvalidId as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found",
        ) from e


@router.get("", response_model=list[WorkoutOut])
async def list_all_workouts(
    _user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Return every workout plan (seeded + any you add later)."""
    cursor = db["workouts"].find({}).sort([("gym_type", 1), ("name", 1)])
    docs = await cursor.to_list(length=None)
    return [_doc_to_out(d) for d in docs]


@router.get("/gym/{gym_type}", response_model=list[WorkoutOut])
async def list_workouts_by_gym_type(
    gym_type: str,
    _user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Filter plans by gym type.

    Allowed `gym_type` values: bodybuilding, crossfit, yoga, home, calisthenics, swimming.
    (Also available as a distinct path to avoid clashing with `GET /workouts/{id}`.)
    """
    key = gym_type.strip().lower()
    if key not in ALLOWED_GYM_TYPES:
        allowed = ", ".join(sorted(ALLOWED_GYM_TYPES))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid gym_type. Allowed values: {allowed}",
        )
    cursor = db["workouts"].find({"gym_type": key}).sort("name", 1)
    docs = await cursor.to_list(length=None)
    return [_doc_to_out(d) for d in docs]


@router.get("/{workout_id}", response_model=WorkoutOut)
async def get_workout_detail(
    workout_id: str,
    _user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Single workout by MongoDB ObjectId."""
    oid = _parse_workout_oid(workout_id)
    doc = await db["workouts"].find_one({"_id": oid})
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found",
        )
    return _doc_to_out(doc)


@router.post("/complete", response_model=WorkoutCompleteOut)
async def mark_workout_complete_today(
    body: WorkoutCompleteIn,
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Record that the user finished this workout for the **current UTC calendar day**.

    Idempotent: repeating the same call on the same day returns success with a short message.
    """
    oid = _parse_workout_oid(body.workout_id)
    workout_doc = await db["workouts"].find_one({"_id": oid})
    if workout_doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found",
        )

    today = datetime.now(timezone.utc).date().isoformat()
    coll = db["workout_completions"]
    doc = {
        "user_id": user.id,
        "workout_id": body.workout_id,
        "date": today,
        "completed_at": datetime.now(timezone.utc),
    }
    try:
        await coll.insert_one(doc)
    except DuplicateKeyError:
        return WorkoutCompleteOut(
            ok=True,
            date=today,
            workout_id=body.workout_id,
            message="Already marked complete for today (UTC)",
        )
    return WorkoutCompleteOut(ok=True, date=today, workout_id=body.workout_id)
