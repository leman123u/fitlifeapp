"""Firebase token verification and MongoDB user provisioning."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.firebase_app import init_firebase, is_firebase_configured
from app.models.user import FitnessGoal, User

logger = logging.getLogger(__name__)

USERS_COLLECTION = "users"


def _env_truthy(key: str) -> bool:
    return os.environ.get(key, "").strip().lower() in ("1", "true", "yes", "on")


def verify_firebase_id_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token from the client (Authorization: Bearer).

    Returns the decoded token dict (includes `uid`, `email`, `name`, etc.).
    """
    if _env_truthy("USE_MOCK_DB") and _env_truthy("MOCK_AUTH"):
        expected = os.environ.get("MOCK_BEARER_TOKEN", "dev-mock-token").strip()
        if id_token == expected:
            return {
                "uid": os.environ.get("MOCK_FIREBASE_UID", "mock-firebase-uid-dev"),
                "email": os.environ.get("MOCK_EMAIL", "dev@example.com").strip(),
                "name": os.environ.get("MOCK_NAME", "Dev User").strip(),
            }
        # Otherwise verify like production (real Firebase ID token from the app).

    init_firebase()
    if not is_firebase_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is not configured",
        )
    try:
        from firebase_admin import auth

        return auth.verify_id_token(id_token)
    except Exception as e:
        logger.info("Firebase ID token verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from e


def _mongo_doc_to_user(doc: dict) -> User:
    data = dict(doc)
    data["id"] = str(data.pop("_id"))
    if "onboarding_completed" not in data:
        data["onboarding_completed"] = True
    if "calorie_goal" not in data:
        data["calorie_goal"] = 2000
    if "diet_type" not in data:
        data["diet_type"] = "standard"
    return User.model_validate(data)


async def get_or_create_user_for_firebase(
    db: AsyncIOMotorDatabase,
    decoded: dict,
) -> User:
    """
    Load user by Firebase UID, or insert a starter profile on first login.

    Default profile values can be edited later via a PATCH profile route.
    """
    uid = decoded["uid"]
    collection = db[USERS_COLLECTION]
    existing = await collection.find_one({"firebase_uid": uid})
    if existing is not None:
        return _mongo_doc_to_user(existing)

    email = (decoded.get("email") or "") or ""
    name = (decoded.get("name") or "").strip() or (
        email.split("@", 1)[0] if email else "User"
    )
    now = datetime.now(timezone.utc)
    new_doc = {
        "firebase_uid": uid,
        "email": email,
        "name": name,
        "age": 25,
        "weight": 70.0,
        "height": 170.0,
        "goal": FitnessGoal.MAINTAIN.value,
        "gym_type": "home",
        "calorie_goal": 2000,
        "diet_type": "standard",
        "onboarding_completed": False,
        "created_at": now,
    }
    try:
        result = await collection.insert_one(new_doc)
    except Exception as e:
        from pymongo.errors import DuplicateKeyError

        if isinstance(e, DuplicateKeyError):
            retry = await collection.find_one({"firebase_uid": uid})
            if retry is not None:
                return _mongo_doc_to_user(retry)
        raise

    new_doc["_id"] = result.inserted_id
    logger.info("Created MongoDB user for Firebase uid %s", uid)
    return _mongo_doc_to_user(new_doc)
