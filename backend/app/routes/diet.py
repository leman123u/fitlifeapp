"""Diet plans: list, filter by calories, detail, daily meal logging."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.deps.auth import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.schemas.diet import DietLogIn, DietLogOut, DietPlanOut, MealLogEntryOut, TodayMealLogOut

router = APIRouter()

NEAR_RANGE_KCAL = 400


def _doc_to_out(doc: dict) -> DietPlanOut:
    d = dict(doc)
    d["id"] = str(d.pop("_id"))
    return DietPlanOut.model_validate(d)


async def _plans_near_calories(
    db: AsyncIOMotorDatabase,
    target: int,
) -> list[DietPlanOut]:
    """Return plans within NEAR_RANGE_KCAL of target, else closest matches."""
    if target < 800 or target > 6000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Calorie target should be between 800 and 6000 kcal.",
        )
    cursor = db["diet_plans"].find({})
    docs = await cursor.to_list(length=None)
    if not docs:
        return []
    ranked = sorted(docs, key=lambda d: abs(d["calorie_goal"] - target))
    close = [d for d in ranked if abs(d["calorie_goal"] - target) <= NEAR_RANGE_KCAL]
    chosen = close if close else ranked[:8]
    return [_doc_to_out(d) for d in chosen]


@router.get("", response_model=list[DietPlanOut])
async def list_all_diet_plans(
    _user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """All seeded and custom diet plans."""
    cursor = db["diet_plans"].find({}).sort(
        [("goal_type", 1), ("calorie_goal", 1), ("name", 1)]
    )
    docs = await cursor.to_list(length=None)
    return [_doc_to_out(d) for d in docs]


@router.get("/log/today", response_model=TodayMealLogOut)
async def get_todays_meal_log(
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Today's meal log (UTC calendar day) for the signed-in user."""
    today = datetime.now(timezone.utc).date().isoformat()
    coll = db["meal_logs"]
    doc = await coll.find_one({"user_id": user.id, "date": today})
    if not doc:
        return TodayMealLogOut(date=today, entries=[], notes="")
    raw = doc.get("entries") or []
    entries: list[MealLogEntryOut] = []
    for e in raw:
        entries.append(
            MealLogEntryOut(
                meal_slot=str(e.get("meal_slot", "")),
                description=str(e.get("description", "")),
                calories=e.get("calories"),
                protein_g=e.get("protein_g"),
                carbs_g=e.get("carbs_g"),
                fat_g=e.get("fat_g"),
            )
        )
    return TodayMealLogOut(
        date=today,
        entries=entries,
        notes=str(doc.get("notes") or ""),
    )


@router.post("/log", response_model=DietLogOut)
async def log_todays_meals(
    body: DietLogIn,
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Save what you ate today (UTC calendar day). Overwrites any previous log for the same day.
    """
    today = datetime.now(timezone.utc).date().isoformat()
    now = datetime.now(timezone.utc)
    coll = db["meal_logs"]
    doc = {
        "user_id": user.id,
        "date": today,
        "entries": [e.model_dump() for e in body.entries],
        "notes": body.notes,
        "updated_at": now,
    }
    await coll.update_one(
        {"user_id": user.id, "date": today},
        {"$set": doc},
        upsert=True,
    )
    return DietLogOut(
        ok=True,
        date=today,
        entry_count=len(body.entries),
        message="Meals logged for today (UTC)",
    )


@router.get(
    "/{segment}",
    response_model=None,
    summary="Calorie filter or plan detail",
    description=(
        "If `segment` is a 24-character hex ObjectId, returns one plan. "
        "If it is a number (e.g. 2000), returns plans near that calorie goal "
        f"(within ~{NEAR_RANGE_KCAL} kcal, or the closest matches)."
    ),
)
async def diet_by_calories_or_id(
    segment: str,
    _user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Any:
    """
    Implements `GET /diet/{calorie_goal}` and `GET /diet/{id}` without path clashes:
    24-char valid ObjectIds load one plan; numeric strings (≤5 digits) filter by calories.
    """
    if len(segment) == 24 and ObjectId.is_valid(segment):
        try:
            oid = ObjectId(segment)
        except InvalidId as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Diet plan not found",
            ) from e
        doc = await db["diet_plans"].find_one({"_id": oid})
        if doc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Diet plan not found",
            )
        return _doc_to_out(doc)

    if segment.isdigit() and len(segment) <= 5:
        return await _plans_near_calories(db, int(segment))

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Diet plan not found or invalid calorie filter (use a numeric calorie target)",
    )
