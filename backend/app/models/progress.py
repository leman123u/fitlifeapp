"""User progress entries for MongoDB `progress` collection."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.types import MongoIdStr, ProgressDateStr


class Progress(BaseModel):
    """Daily or ad-hoc progress log linked to a user."""

    model_config = ConfigDict(
        populate_by_name=True,
        str_strip_whitespace=True,
    )

    id: MongoIdStr = Field(..., description="MongoDB _id as hex string")
    user_id: MongoIdStr = Field(..., description="References users.id")
    date: ProgressDateStr = Field(
        ...,
        description="Calendar day for this entry (ISO YYYY-MM-DD)",
    )
    weight: Optional[float] = Field(
        default=None,
        ge=0,
        description="Body weight that day (kg), optional",
    )
    calories_eaten: int = Field(
        default=0,
        ge=0,
        description="Total calories consumed",
    )
    workout_completed: bool = Field(
        default=False,
        description="Whether a planned workout was completed",
    )
    notes: Optional[str] = Field(
        default=None,
        description="Free-form notes",
    )
