from fastapi import APIRouter

api_router = APIRouter(prefix="/api")


@api_router.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    """Simple health probe for the new modular app."""
    return {"status": "ok"}


__all__ = ["api_router"]
