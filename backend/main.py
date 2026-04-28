"""
Entry shim so you can run from the ``backend`` folder::

    python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

The real FastAPI app (routes, DB, Firebase) lives in ``app.main``.
"""

from app.main import app

__all__ = ["app"]
