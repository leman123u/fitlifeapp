"""Firebase Admin SDK initialization (singleton)."""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

# backend/ (directory that contains the `app` package)
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent


def _env_truthy(key: str) -> bool:
    return os.environ.get(key, "").strip().lower() in ("1", "true", "yes", "on")


def missing_credentials_ok_for_startup() -> bool:
    """Match ``auth_users.verify_firebase_id_token`` mock path: mock DB + mock auth."""
    return _env_truthy("USE_MOCK_DB") and _env_truthy("MOCK_AUTH")


def _resolve_credentials_path(raw: str) -> str | None:
    """
    Resolve GOOGLE_APPLICATION_CREDENTIALS so it works whether uvicorn's cwd is
    ``backend/`` or the repo root. Returns a path that exists, or None.
    """
    raw = raw.strip()
    if not raw:
        return None
    candidates: list[Path] = []
    p = Path(raw)
    if p.is_absolute():
        candidates.append(p)
    else:
        candidates.append(Path.cwd() / raw)
        candidates.append(Path.cwd() / raw.replace("\\", "/").lstrip("./"))
        candidates.append(_BACKEND_ROOT / raw.replace("\\", "/").lstrip("./"))
    for c in candidates:
        try:
            if c.is_file():
                return str(c.resolve())
        except OSError:
            continue
    return None


_initialized = False


def is_firebase_configured() -> bool:
    """True if `initialize_app` ran successfully."""
    return _initialized


def _resolve_firebase_key_path() -> tuple[str | None, str]:
    """
    Resolve the service account JSON path from env or default filename.

    Checks in order:
    - ``FIREBASE_SERVICE_ACCOUNT_PATH`` (preferred in .env for this project)
    - ``GOOGLE_APPLICATION_CREDENTIALS`` (standard Google env var)
    - ``<backend>/firebase-admin-key.json``

    Returns (resolved absolute path or None, default path for error messages).
    """
    _here = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(os.path.dirname(_here))
    default_cred_path = os.path.normpath(os.path.join(backend_dir, "firebase-admin-key.json"))

    for env_key in ("FIREBASE_SERVICE_ACCOUNT_PATH", "GOOGLE_APPLICATION_CREDENTIALS"):
        raw = os.environ.get(env_key, "").strip()
        if raw:
            resolved = _resolve_credentials_path(raw)
            if resolved:
                return resolved, default_cred_path

    if os.path.isfile(default_cred_path):
        return os.path.normpath(default_cred_path), default_cred_path

    return None, default_cred_path


def init_firebase(*, allow_missing_credentials: bool = False) -> None:
    """
    Initialize Firebase Admin once.

    Credential resolution order:
    1. ``FIREBASE_SERVICE_ACCOUNT_JSON`` env var (JSON string — for cloud deployments)
    2. ``FIREBASE_SERVICE_ACCOUNT_PATH`` env var (file path)
    3. ``GOOGLE_APPLICATION_CREDENTIALS`` env var (file path)
    4. ``<backend>/firebase-admin-key.json`` (local default)

    If no credentials are found and ``allow_missing_credentials`` is True (e.g. local mock auth),
    logs a warning and returns without initializing — the API can still run for MOCK_AUTH flows.
    """
    global _initialized
    if _initialized:
        return

    import firebase_admin
    from firebase_admin import credentials

    if firebase_admin._apps:
        _initialized = True
        return

    # 1. Try JSON string from environment variable (preferred for cloud deployments)
    json_env = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    if json_env:
        try:
            service_account_info = json.loads(json_env)
            cred = credentials.Certificate(service_account_info)
            firebase_admin.initialize_app(cred)
            _initialized = True
            proj = service_account_info.get("project_id", "?")
            client = service_account_info.get("client_email", "?")
            logger.info(
                "Firebase Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT_JSON env var: project_id=%s client=%s",
                proj,
                client,
            )
            return
        except Exception as e:
            logger.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: %s", e)
            raise

    # 2 & 3 & 4. Fall back to file-based resolution
    cred_path, default_cred_path = _resolve_firebase_key_path()

    fb_env = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "").strip()
    gac_env = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    logger.info(
        "Firebase key lookup: FIREBASE_SERVICE_ACCOUNT_JSON=(unset) FIREBASE_SERVICE_ACCOUNT_PATH=%r GOOGLE_APPLICATION_CREDENTIALS=%r default=%s",
        fb_env or "(unset)",
        gac_env or "(unset)",
        default_cred_path,
    )

    if not cred_path or not os.path.isfile(cred_path):
        msg = (
            f"Firebase service account JSON not found (looked for "
            f"FIREBASE_SERVICE_ACCOUNT_JSON env var, FIREBASE_SERVICE_ACCOUNT_PATH / "
            f"GOOGLE_APPLICATION_CREDENTIALS, then {default_cred_path})."
        )
        if allow_missing_credentials:
            logger.warning("%s Skipping Firebase Admin init (mock/dev mode).", msg)
            return
        logger.error(msg)
        raise FileNotFoundError(msg)

    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    _initialized = True
    logger.info("Firebase Admin SDK initialized successfully (path=%s)", cred_path)
    try:
        with open(cred_path, encoding="utf-8") as f:
            meta = json.load(f)
        proj = meta.get("project_id", "?")
        client = meta.get("client_email", "?")
        logger.info(
            "Firebase Admin SDK: project_id=%s client=%s",
            proj,
            client,
        )
    except Exception:
        pass
