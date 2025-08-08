"""Pydantic models for FIRMS request parameters."""

from datetime import date
from enum import Enum
from typing import Optional, Tuple, Union

from pydantic import BaseModel, Field, field_validator, ConfigDict


class Source(str, Enum):
    VIIRS_NOAA21_NRT = "VIIRS_NOAA21_NRT"
    VIIRS_NOAA20_NRT = "VIIRS_NOAA20_NRT"
    VIIRS_SNPP_NRT = "VIIRS_SNPP_NRT"
    VIIRS_NOAA20_SP = "VIIRS_NOAA20_SP"
    VIIRS_SNPP_SP = "VIIRS_SNPP_SP"
    MODIS_NRT = "MODIS_NRT"
    MODIS_SP = "MODIS_SP"
    LANDSAT_NRT = "LANDSAT_NRT"


class CountryParams(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    source: Source
    country: str = Field(pattern=r"^[A-Z]{3}$")
    day_range: int = Field(alias="dayRange", ge=1, le=10)
    start: Optional[date] = None


class AreaParams(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    source: Source
    area: Union[str, Tuple[float, float, float, float]]
    day_range: int = Field(alias="dayRange", ge=1, le=10)
    start: Optional[date] = None

    @field_validator("area")
    @classmethod
    def validate_area(cls, v):
        if v == "world":
            return v
        w, s, e, n = v
        if not (-180 <= w < e <= 180 and -90 <= s < n <= 90):
            raise ValueError("invalid coordinate range")
        return v
