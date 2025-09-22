"""Application bootstrap."""

from fastapi import FastAPI
from .api.router import api_router

app = FastAPI(title="Wildfire Visualization API vNext")
app.include_router(api_router)

__all__ = ["app"]
