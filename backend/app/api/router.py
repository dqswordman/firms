from fastapi import APIRouter

from .routes.fires import router as fires_router
from ..core.config import settings
from utils.data_availability import check_data_availability
from utils.http_exceptions import HTTPExceptionFactory

api_router = APIRouter(prefix="/api")
api_router.include_router(fires_router)


@api_router.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    """Simple health probe for the new modular app."""
    return {"status": "ok"}


@api_router.get("/debug/availability", tags=["system"])
async def debug_availability(sensor: str = "ALL") -> dict[str, tuple[str, str]]:
    """Return FIRMS availability metadata for the configured MAP key.

    Helps diagnose 503s due to invalid keys or missing permissions.
    """
    try:
        key = settings.map_key
    except RuntimeError as exc:
        raise HTTPExceptionFactory.service_unavailable(str(exc)) from exc

    try:
        return check_data_availability(key, sensor)
    except Exception as exc:  # pragma: no cover - passthrough diagnostics
        raise HTTPExceptionFactory.service_unavailable(
            "Failed to query FIRMS availability. Check your MAP key and network access.",
            details=str(exc),
        ) from exc
