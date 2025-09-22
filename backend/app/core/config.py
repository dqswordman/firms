import logging
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

DEFAULT_SOURCE_PRIORITY = [
    "VIIRS_SNPP_NRT",
    "VIIRS_NOAA21_NRT",
    "VIIRS_NOAA20_NRT",
    "MODIS_NRT",
    "VIIRS_NOAA20_SP",
    "VIIRS_SNPP_SP",
    "MODIS_SP",
]


class Settings(BaseSettings):
    app_name: str = "Wildfire Visualization API vNext"
    version: str = "0.1.0"
    firms_map_key: Optional[str] = Field(default=None, alias="FIRMS_MAP_KEY")
    legacy_map_key: Optional[str] = Field(default=None, alias="FIRMS_API_KEY")
    allowed_origins_raw: Optional[str] = Field(default=None, alias="ALLOWED_ORIGINS")
    max_concurrency: int = Field(default=5, alias="MAX_CONCURRENT_REQUESTS")
    default_source_priority: List[str] = Field(default_factory=lambda: DEFAULT_SOURCE_PRIORITY)

    class Config:
        env_file = "backend/.env"
        case_sensitive = False

    @property
    def map_key(self) -> str:
        if self.firms_map_key:
            return self.firms_map_key
        if self.legacy_map_key:
            logging.getLogger(__name__).warning(
                "FIRMS_API_KEY is deprecated; please migrate to FIRMS_MAP_KEY"
            )
            return self.legacy_map_key
        raise RuntimeError("FIRMS_MAP_KEY is not configured")

    @property
    def allowed_origins(self) -> List[str]:
        if self.allowed_origins_raw:
            origins = [o.strip() for o in self.allowed_origins_raw.split(",") if o.strip()]
            if origins:
                return origins
        return DEFAULT_ALLOWED_ORIGINS


settings = Settings()
