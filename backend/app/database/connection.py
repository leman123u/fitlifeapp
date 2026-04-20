"""Async MongoDB connection using Motor."""

from __future__ import annotations

import os
from typing import Any, cast

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

_client: AsyncIOMotorClient[Any] | None = None
_db: AsyncIOMotorDatabase[Any] | Any | None = None
_mock_db: bool = False


def _env_truthy(key: str) -> bool:
    return os.environ.get(key, "").strip().lower() in ("1", "true", "yes", "on")


async def connect_db() -> None:
    """Connect to MongoDB, or use an in-memory mock when ``USE_MOCK_DB`` is set."""
    global _client, _db, _mock_db
    if _env_truthy("USE_MOCK_DB"):
        from app.database.mock_async import build_seeded_mock_database

        _mock_db = True
        _client = None
        _db = await build_seeded_mock_database()
        return

    _mock_db = False
    uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
    name = os.environ.get("MONGODB_DB_NAME", "fitlife_pro")
    _client = AsyncIOMotorClient(uri)
    _db = _client[name]
    await _ensure_indexes(_db)


async def _ensure_indexes(db: AsyncIOMotorDatabase[Any]) -> None:
    """Indexes for users, workouts, and completion logs."""
    await db["users"].create_index("firebase_uid", unique=True)
    await db["workouts"].create_index("gym_type")
    await db["workout_completions"].create_index(
        [("user_id", 1), ("workout_id", 1), ("date", 1)],
        unique=True,
    )
    await db["diet_plans"].create_index("calorie_goal")
    await db["diet_plans"].create_index("goal_type")
    await db["meal_logs"].create_index(
        [("user_id", 1), ("date", 1)],
        unique=True,
    )
    await db["progress"].create_index(
        [("user_id", 1), ("date", 1)],
        unique=True,
    )
    await db["water_intake"].create_index(
        [("user_id", 1), ("date", 1)],
        unique=True,
    )


async def close_db() -> None:
    global _client, _db, _mock_db
    if _mock_db:
        _db = None
        _mock_db = False
        return
    if _client is not None:
        _client.close()
    _client = None
    _db = None


def get_db() -> AsyncIOMotorDatabase[Any]:
    if _db is None:
        msg = "Database not connected. Ensure connect_db() ran at startup."
        raise RuntimeError(msg)
    return cast(AsyncIOMotorDatabase[Any], _db)


def is_mock_db() -> bool:
    return _mock_db
