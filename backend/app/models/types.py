"""Pydantic v2 helpers for Mongo-friendly values (ObjectId → str, dates → ISO strings)."""

from __future__ import annotations

from datetime import date, datetime
from typing import Annotated, Any

from bson import ObjectId
from pydantic import BeforeValidator, GetCoreSchemaHandler
from pydantic.json_schema import GetJsonSchemaHandler, JsonSchemaValue
from pydantic_core import core_schema


def _coerce_object_id(value: Any) -> str:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, str):
        return value
    raise TypeError(f"id must be str or bson.ObjectId, got {type(value).__name__}")


def _coerce_progress_date(value: Any) -> str:
    """Normalize Mongo date/datetime/string to YYYY-MM-DD."""
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, str):
        return value[:10]
    raise TypeError(f"date must be date, datetime, or str, got {type(value).__name__}")


class PyObjectId(str):
    """
    MongoDB ObjectId represented as a string in API and models.

    Accepts ``bson.ObjectId`` or ``str`` when validating (e.g. from Motor documents).
    """

    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source: Any, _handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        def validate(value: Any) -> str:
            return _coerce_object_id(value)

        return core_schema.no_info_plain_validator_function(
            validate,
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x),
                return_schema=core_schema.str_schema(),
                when_used="always",
            ),
        )

    @classmethod
    def __get_pydantic_json_schema__(
        cls, _core_schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return {"type": "string", "description": "MongoDB ObjectId as hex string"}


MongoIdStr = Annotated[str, BeforeValidator(_coerce_object_id)]
ProgressDateStr = Annotated[str, BeforeValidator(_coerce_progress_date)]

__all__ = [
    "MongoIdStr",
    "ProgressDateStr",
    "PyObjectId",
]
