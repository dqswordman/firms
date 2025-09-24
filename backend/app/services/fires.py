from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from datetime import datetime
from itertools import chain
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple

import httpx
from fastapi import Response

from utils.data_availability import check_data_availability
from utils.geojson import to_geojson
from utils.http_exceptions import HTTPExceptionFactory
from utils.urlbuilder import compose_urls

from ..clients.firms import FIRMSClient, deduplicate
from ..core.config import DEFAULT_SOURCE_PRIORITY, settings

logger = logging.getLogger(__name__)

SOURCE_WHITELIST = {
    "VIIRS_NOAA21_NRT",
    "VIIRS_NOAA20_NRT",
    "VIIRS_SNPP_NRT",
    "VIIRS_NOAA20_SP",
    "VIIRS_SNPP_SP",
    "MODIS_NRT",
    "MODIS_SP",
    "LANDSAT_NRT",
}

COUNTRY_BBOX = {
    "USA": (-179.14, 18.91, -66.97, 71.39),
    "CHN": (73.66, 18.16, 134.77, 53.56),
    "IND": (68.17665, 6.554607, 97.40256, 35.674545),
    "RUS": (-180.0, 41.19, 180.0, 81.86),
    "BRA": (-73.99, -33.77, -34.73, 5.27),
    "AUS": (112.92, -43.74, 153.64, -10.06),
    "CAN": (-141.0, 41.68, -52.65, 83.11),
    "MEX": (-118.37, 14.53, -86.71, 32.72),
    "IDN": (95.01, -10.36, 141.02, 5.90),
    "ZAF": (16.45, -34.82, 32.89, -22.13),
    "ARG": (-73.58, -55.11, -53.64, -21.78),
    "COL": (-79.06, -4.23, -66.87, 13.39),
    "SAU": (34.5, 16.37, 55.67, 32.16),
    "IRN": (44.04, 25.06, 63.32, 39.78),
    "TUR": (25.66, 35.82, 44.82, 42.11),
    "FRA": (-5.14, 41.33, 9.56, 51.09),
    "DEU": (5.87, 47.27, 15.04, 55.06),
    "GBR": (-8.62, 49.84, 1.76, 60.85),
    "ESP": (-9.3, 35.96, 3.32, 43.79),
    "ITA": (6.62, 36.65, 18.51, 47.09),
    "JPN": (122.94, 24.25, 153.99, 45.52),
    "KOR": (125.07, 33.10, 131.87, 38.62),
    "VNM": (102.14, 8.56, 109.47, 23.35),
    "THA": (97.35, 5.61, 105.64, 20.42),
    "PAK": (60.88, 23.69, 77.84, 37.08),
    "BGD": (88.0, 20.74, 92.67, 26.63),
}

ISO3_RE = __import__("re").compile(r"^[A-Z]{3}$")


@dataclass
class FireQueryContext:
    urls: List[str]
    selected_source: str


class FireService:
    def __init__(self) -> None:
        self.client = FIRMSClient()

    async def prepare_query(
        self,
        response: Response,
        *,
        country: Optional[str],
        west: Optional[float],
        south: Optional[float],
        east: Optional[float],
        north: Optional[float],
        start_date: Optional[str],
        end_date: Optional[str],
        source_priority: Optional[str],
    ) -> Optional[FireQueryContext]:
        map_key = self._resolve_map_key()

        requested_country_mode = False
        if country:
            requested_country_mode = True
            country = country.upper()
            if not ISO3_RE.fullmatch(country):
                raise HTTPExceptionFactory.bad_request(
                    "Country code must be ISO-3 (3 uppercase letters)"
                )

        if None not in (west, south, east, north):
            if not self._bbox_ok(west, south, east, north):
                raise HTTPExceptionFactory.bad_request("Invalid coordinate range")
            requested_country_mode = False
        elif country:
            bbox = COUNTRY_BBOX.get(country)
            if not bbox:
                raise HTTPExceptionFactory.bad_request(
                    "Unknown or unsupported ISO-3 country code; please use bbox coordinates"
                )
            west, south, east, north = bbox
        else:
            raise HTTPExceptionFactory.bad_request(
                "Must provide either country code or complete coordinate range"
            )

        start = self._parse_date(start_date)
        end = self._parse_date(end_date)
        # Use local date to align with frontend date pickers and avoid UTC/locale mismatches
        now = datetime.now().date()
        if start > end:
            raise HTTPExceptionFactory.bad_request("Start date must not be later than end date")
        if end > now:
            raise HTTPExceptionFactory.bad_request("End date cannot exceed today")

        priorities = self._resolve_priorities(source_priority)
        try:
            availability = await asyncio.to_thread(check_data_availability, map_key, "ALL")
        except Exception as exc:  # pragma: no cover - defensive
            raise HTTPExceptionFactory.service_unavailable(
                "Invalid or unauthorized FIRMS MAP_KEY. Please update backend/.env",
                details=str(exc),
            ) from exc

        selected_source = None
        for src in priorities:
            if src not in SOURCE_WHITELIST or src not in availability:
                continue
            min_d, max_d = availability[src]
            min_d = datetime.strptime(min_d, "%Y-%m-%d").date()
            max_d = datetime.strptime(max_d, "%Y-%m-%d").date()
            if min_d <= start and end <= max_d:
                selected_source = src
                break

        if not selected_source:
            response.headers["X-Data-Availability"] = "No data available for requested date range"
            return None

        # Always use area URLs. The FIRMS country endpoint is currently marked
        # "Feature not available" and can return Invalid API call.
        urls = compose_urls(
            map_key,
            selected_source,
            start,
            end,
            area=(west, south, east, north),
        )
        return FireQueryContext(urls=urls, selected_source=selected_source)

    async def fetch(
        self,
        ctx: FireQueryContext,
        *,
        max_concurrency: Optional[int] = None,
    ) -> List[Dict]:
        concurrency = max_concurrency or settings.max_concurrency
        headers = {"Accept-Encoding": "gzip, deflate"}
        async with httpx.AsyncClient(headers=headers) as client:
            sem = asyncio.Semaphore(max(1, concurrency))

            async def fetch_one(url: str) -> List[Dict]:
                async with sem:
                    return await self.client.fetch_records(url, ctx.selected_source, client=client)

            results = await asyncio.gather(*(fetch_one(url) for url in ctx.urls))
        return deduplicate(chain.from_iterable(results))

    async def stream_ndjson(self, ctx: FireQueryContext) -> AsyncGenerator[bytes, None]:
        headers = {"Accept-Encoding": "gzip, deflate"}
        async with httpx.AsyncClient(headers=headers) as client:
            seen = set()
            for url in ctx.urls:
                async for row in self.client.stream_records(url, ctx.selected_source, client=client):
                    key = (
                        row.get("acq_date"),
                        row.get("acq_time"),
                        row.get("latitude"),
                        row.get("longitude"),
                        row.get("source"),
                    )
                    if key in seen:
                        continue
                    seen.add(key)
                    feature = to_geojson([row])["features"][0]
                    yield (json.dumps(feature) + "\n").encode("utf-8")

    def to_geojson(self, records: List[Dict]) -> Dict[str, Any]:
        return to_geojson(records)

    def empty_response(self, format: str) -> Any:
        if format == "geojson":
            return to_geojson([])
        return []

    def compute_stats(self, points: List[Dict], *, frp_mid: float, frp_high: float) -> Dict[str, Any]:
        return _compute_stats(points, frp_mid=frp_mid, frp_high=frp_high)

    @staticmethod
    def _parse_date(value: Optional[str]) -> datetime.date:
        if value is None:
            return datetime.utcnow().date()
        try:
            return datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError as exc:
            raise HTTPExceptionFactory.bad_request("Date format must be YYYY-MM-DD") from exc

    @staticmethod
    def _bbox_ok(west: float, south: float, east: float, north: float) -> bool:
        return -180 <= west < east <= 180 and -90 <= south < north <= 90

    def _resolve_priorities(self, raw: Optional[str]) -> List[str]:
        if raw:
            return [s.strip().upper() for s in raw.split(",") if s.strip()]
        return settings.default_source_priority

    def _resolve_map_key(self) -> str:
        try:
            return settings.map_key
        except RuntimeError as exc:
            raise HTTPExceptionFactory.service_unavailable(str(exc)) from exc


def _compute_stats(points: List[Dict], frp_mid: float = 5, frp_high: float = 20) -> Dict[str, Any]:
    total = len(points)
    stats = {
        "totalPoints": total,
        "avgFrp": 0.0,
        "maxFrp": 0.0,
        "sumFrp": 0.0,
        "dayCount": 0,
        "nightCount": 0,
        "highConfidence": 0,
        "mediumConfidence": 0,
        "lowConfidence": 0,
        "viirsCount": 0,
        "terraCount": 0,
        "aquaCount": 0,
    }

    for point in points:
        frp_raw = point.get("frp")
        frp = 0.0
        if isinstance(frp_raw, (int, float)):
            frp = float(frp_raw)
        elif isinstance(frp_raw, str):
            try:
                frp = float(frp_raw)
            except ValueError:
                frp = 0.0
        stats["sumFrp"] += frp
        stats["maxFrp"] = max(stats["maxFrp"], frp)
        if frp >= frp_high:
            stats["frpHighCount"] = stats.get("frpHighCount", 0) + 1
        elif frp >= frp_mid:
            stats["frpMidCount"] = stats.get("frpMidCount", 0) + 1
        else:
            stats["frpLowCount"] = stats.get("frpLowCount", 0) + 1

        if str(point.get("daynight", "")).upper() == "D":
            stats["dayCount"] += 1
        else:
            stats["nightCount"] += 1

        conf = str(point.get("confidence", "")).lower()
        if conf == "h" or (conf.isdigit() and int(conf) >= 80):
            stats["highConfidence"] += 1
        elif conf == "n" or (conf.isdigit() and int(conf) >= 30):
            stats["mediumConfidence"] += 1
        else:
            stats["lowConfidence"] += 1

        sat = (point.get("satellite") or "").upper()
        if sat.startswith("N"):
            stats["viirsCount"] += 1
        elif sat == "T":
            stats["terraCount"] += 1
        else:
            stats["aquaCount"] += 1

    stats["avgFrp"] = stats["sumFrp"] / total if total else 0.0
    return stats

