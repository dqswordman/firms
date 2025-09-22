from fastapi import APIRouter

from .routes.fires import router as fires_router

api_router = APIRouter(prefix="/api")
api_router.include_router(fires_router)


@api_router.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    """Simple health probe for the new modular app."""
    return {"status": "ok"}
