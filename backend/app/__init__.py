"""Application bootstrap."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from .api.router import api_router
from .core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version=settings.version)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    app.include_router(api_router)
    return app


app = create_app()

__all__ = ["app", "create_app"]
