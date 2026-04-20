"""Global exception handlers for consistent API error responses."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.responses import JSONResponse

from app.core.config import is_production

logger = logging.getLogger(__name__)


def _error_body(
    *,
    message: str,
    code: str,
    details: dict[str, Any] | list[Any] | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "error": {
            "message": message,
            "code": code,
        }
    }
    if details is not None:
        body["error"]["details"] = details
    return body


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(
        request: Request,
        exc: HTTPException,
    ) -> JSONResponse:
        detail = exc.detail
        if isinstance(detail, str):
            message = detail
        else:
            message = str(detail)
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_body(
                message=message,
                code=f"HTTP_{exc.status_code}",
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=_error_body(
                message="Request validation failed",
                code="VALIDATION_ERROR",
                details=exc.errors(),
            ),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        logger.exception("Unhandled exception: %s", exc)
        message = (
            "An unexpected error occurred"
            if is_production()
            else str(exc) or repr(exc)
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_error_body(
                message=message,
                code="INTERNAL_ERROR",
            ),
        )
