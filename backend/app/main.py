"""FastAPI application entrypoint."""

from fastapi import FastAPI
from .core.config import settings
from .api.router import api_router


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version=settings.version)
    app.include_router(api_router)
    return app


app = create_app()
