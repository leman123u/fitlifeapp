"""In-memory async Mongo-like collections for local dev without MongoDB."""

from __future__ import annotations

import copy
import logging
from typing import Any

from bson import ObjectId
from pymongo.errors import DuplicateKeyError

logger = logging.getLogger(__name__)

# Unique constraints mirroring connection._ensure_indexes
_UNIQUE_FIELDS: dict[str, list[tuple[str, ...]]] = {
    "users": (("firebase_uid",),),
    "workout_completions": (("user_id", "workout_id", "date"),),
    "meal_logs": (("user_id", "date"),),
    "progress": (("user_id", "date"),),
    "water_intake": (("user_id", "date"),),
}


def _field_matches(doc_val: Any, condition: Any) -> bool:
    if isinstance(condition, dict) and condition and all(
        isinstance(k, str) and k.startswith("$") for k in condition
    ):
        for op, val in condition.items():
            if op == "$gte":
                if doc_val is None or doc_val < val:
                    return False
            elif op == "$lte":
                if doc_val is None or doc_val > val:
                    return False
            elif op == "$gt":
                if doc_val is None or doc_val <= val:
                    return False
            elif op == "$lt":
                if doc_val is None or doc_val >= val:
                    return False
            else:
                return False
        return True
    return doc_val == condition


def _doc_matches(doc: dict, query: dict) -> bool:
    if not query:
        return True
    for key, condition in query.items():
        if not _field_matches(doc.get(key), condition):
            return False
    return True


def _apply_update(doc: dict, update: dict) -> None:
    # Match MongoDB: $inc before $set so explicit $set values win (e.g. updated_at).
    if "$inc" in update:
        for k, v in update["$inc"].items():
            doc[k] = int(doc.get(k, 0)) + int(v)
    if "$set" in update:
        for k, v in update["$set"].items():
            doc[k] = v


class MockUpdateResult:
    def __init__(
        self,
        matched_count: int = 0,
        modified_count: int = 0,
        upserted_id: Any = None,
    ) -> None:
        self.matched_count = matched_count
        self.modified_count = modified_count
        self.upserted_id = upserted_id


class MockInsertOneResult:
    def __init__(self, inserted_id: Any) -> None:
        self.inserted_id = inserted_id


class MockInsertManyResult:
    def __init__(self, inserted_ids: list[Any]) -> None:
        self.inserted_ids = inserted_ids


class MockCursor:
    def __init__(self, coll: "MockAsyncCollection", query: dict[str, Any]) -> None:
        self._coll = coll
        self._query = query
        self._sort_spec: list[tuple[str, int]] = []

    def sort(self, key_or_list: Any, direction: int | None = None) -> MockCursor:
        if isinstance(key_or_list, list) and (
            not key_or_list or isinstance(key_or_list[0], (list, tuple))
        ):
            self._sort_spec = [(str(a[0]), int(a[1])) for a in key_or_list]
        else:
            self._sort_spec = [(str(key_or_list), int(direction if direction is not None else 1))]
        return self

    async def to_list(self, length: int | None = None) -> list[dict[str, Any]]:
        docs = [copy.deepcopy(d) for d in self._coll._docs if _doc_matches(d, self._query)]
        if self._sort_spec:
            for key, direc in reversed(self._sort_spec):
                docs.sort(
                    key=lambda d, k=key: (d.get(k) is None, d.get(k)),
                    reverse=(direc < 0),
                )
        if length is not None:
            docs = docs[:length]
        return docs


class MockAsyncCollection:
    def __init__(self, name: str, docs: list[dict[str, Any]]) -> None:
        self._name = name
        self._docs = docs

    def _assert_unique(self, doc: dict[str, Any], skip_id: Any | None = None) -> None:
        for fields in _UNIQUE_FIELDS.get(self._name, ()):
            for ex in self._docs:
                if skip_id is not None and ex.get("_id") == skip_id:
                    continue
                if all(ex.get(f) == doc.get(f) for f in fields):
                    raise DuplicateKeyError(
                        f"duplicate key on {self._name} {fields}",
                    )

    def find(self, query: dict[str, Any] | None = None) -> MockCursor:
        return MockCursor(self, query or {})

    async def find_one(self, query: dict[str, Any]) -> dict[str, Any] | None:
        for d in self._docs:
            if _doc_matches(d, query):
                return copy.deepcopy(d)
        return None

    async def count_documents(self, query: dict[str, Any]) -> int:
        return sum(1 for d in self._docs if _doc_matches(d, query))

    async def insert_one(self, doc: dict[str, Any]) -> MockInsertOneResult:
        new_doc = copy.deepcopy(doc)
        if "_id" not in new_doc:
            new_doc["_id"] = ObjectId()
        self._assert_unique(new_doc)
        self._docs.append(new_doc)
        return MockInsertOneResult(new_doc["_id"])

    async def insert_many(self, docs: list[dict[str, Any]]) -> MockInsertManyResult:
        ids: list[Any] = []
        for doc in docs:
            res = await self.insert_one(doc)
            ids.append(res.inserted_id)
        return MockInsertManyResult(ids)

    async def update_one(
        self,
        filter_q: dict[str, Any],
        update: dict[str, Any],
        upsert: bool = False,
    ) -> MockUpdateResult:
        for i, d in enumerate(self._docs):
            if _doc_matches(d, filter_q):
                _apply_update(self._docs[i], update)
                return MockUpdateResult(matched_count=1, modified_count=1)
        if not upsert:
            return MockUpdateResult()
        new_doc: dict[str, Any] = {**filter_q}
        _apply_update(new_doc, update)
        if "_id" not in new_doc:
            new_doc["_id"] = ObjectId()
        self._assert_unique(new_doc)
        self._docs.append(new_doc)
        return MockUpdateResult(
            matched_count=0,
            modified_count=1,
            upserted_id=new_doc["_id"],
        )


class MockAsyncDatabase:
    """Duck-typed stand-in for Motor AsyncIOMotorDatabase."""

    def __init__(self) -> None:
        self._collections: dict[str, list[dict[str, Any]]] = {}

    def __getitem__(self, name: str) -> MockAsyncCollection:
        if name not in self._collections:
            self._collections[name] = []
        return MockAsyncCollection(name, self._collections[name])


async def build_seeded_mock_database() -> MockAsyncDatabase:
    """Empty DB; caller runs seed_workouts_if_empty / seed_diet_plans_if_empty."""
    db = MockAsyncDatabase()
    logger.info("Using in-memory mock database (USE_MOCK_DB=1); no MongoDB connection.")
    return db
