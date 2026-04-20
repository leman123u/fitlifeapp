"""
Entry shim so you can run from the ``backend`` folder::

    uvicorn main:app --reload --port 8000

The real FastAPI app lives in ``app.main``.
"""

from app.main import app

__all__ = ["app"]
