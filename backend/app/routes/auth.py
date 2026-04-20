"""Authentication: Firebase ID token verification and user profile."""

from __future__ import annotations

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.connection import get_db
from app.deps.auth import get_current_user
from app.models.user import User
from app.schemas.onboarding import OnboardingIn
from app.schemas.user import UserOut
from app.services.auth_users import USERS_COLLECTION, _mongo_doc_to_user

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


def _user_to_out(user: User) -> UserOut:
    return UserOut.model_validate(user.model_dump(exclude={"firebase_uid"}))


@router.get("/me", response_model=UserOut)
async def read_my_profile(user: User = Depends(get_current_user)):
    """
    Return the current user's MongoDB profile.

    Send header: `Authorization: Bearer <Firebase ID token>`.

    On first login, creates a starter profile that onboarding can replace.
    """
    return _user_to_out(user)


@router.put("/onboarding", response_model=UserOut)
async def complete_onboarding(
    body: OnboardingIn,
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Save onboarding answers and mark the profile complete."""
    key = body.gym_type.strip().lower()
    if key not in ALLOWED_GYM_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid gym_type. Allowed: {sorted(ALLOWED_GYM_TYPES)}",
        )

    try:
        oid = ObjectId(user.id)
    except InvalidId as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user id",
        ) from e

    update = {
        "name": body.name.strip(),
        "age": body.age,
        "weight": body.weight,
        "height": body.height,
        "goal": body.goal.value,
        "gym_type": key,
        "calorie_goal": body.calorie_goal,
        "diet_type": body.diet_type.value,
        "onboarding_completed": True,
    }

    coll = db[USERS_COLLECTION]
    result = await coll.update_one({"_id": oid}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    doc = await coll.find_one({"_id": oid})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _user_to_out(_mongo_doc_to_user(doc))
