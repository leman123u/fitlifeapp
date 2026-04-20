"""Authentication dependencies (Firebase ID token + MongoDB user)."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.connection import get_db
from app.models.user import User
from app.services.auth_users import get_or_create_user_for_firebase, verify_firebase_id_token

bearer_scheme = HTTPBearer(
    scheme_name="Firebase ID token",
    description="Paste a Firebase ID token: Authorization: Bearer <token>",
)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> User:
    """
    Verify `Authorization: Bearer <Firebase ID token>`, ensure a MongoDB user exists,
    and return the `User` model. Use as a dependency on any protected route.

    Example:
        @router.get("/something")
        async def something(user: User = Depends(get_current_user)):
            ...
    """
    decoded = verify_firebase_id_token(credentials.credentials)
    return await get_or_create_user_for_firebase(db, decoded)
