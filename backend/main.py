import os
import csv
import io
import json
import asyncio
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple

import httpx
import logging
from fastapi import FastAPI, Query, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv

import re
from utils.data_availability import check_data_availability
from utils.urlbuilder import compose_urls
from utils.geojson import to_geojson
from utils.http_exceptions import HTTPExceptionFactory

# Configure CORS
load_dotenv()
logger = logging.getLogger(__name__)
app = FastAPI(title="Wildfire Visualization API")

# Read allowed origins from environment; default to local dev
_allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if _allowed_origins_env:
    allowed_origins = [o.strip() for o in _allowed_origins_env.split(",") if o.strip()]
else:
    allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# NASA FIRMS API configuration
MAP_KEY = os.getenv("FIRMS_MAP_KEY")
if not MAP_KEY:
    legacy = os.getenv("FIRMS_API_KEY")
    if legacy:
        MAP_KEY = legacy
        logger.warning("FIRMS_API_KEY is deprecated; please use FIRMS_MAP_KEY")
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

DEFAULT_SOURCE_PRIORITY = [
    "VIIRS_SNPP_NRT",
    "VIIRS_NOAA21_NRT",
    "VIIRS_NOAA20_NRT",
    "MODIS_NRT",
    "VIIRS_NOAA20_SP",
    "VIIRS_SNPP_SP",
    "MODIS_SP",
]

MAX_CONCURRENT_REQUESTS = int(os.getenv("MAX_CONCURRENT_REQUESTS", "5"))

# Minimal ISO3 -> bbox mapping for common countries (west, south, east, north)
COUNTRY_BBOX = {
    "USA": (-179.14, 18.91, -66.97, 71.39),  # USA incl. Alaska/Hawaii (approx.)
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

# ---------- Utility Functions ----------
def _parse_date(d: Optional[str]) -> datetime.date:
    if d is None:
        return datetime.utcnow().date()
    try:
        return datetime.strptime(d, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPExceptionFactory.bad_request(
            "Date format must be YYYY-MM-DD"
        )

def _bbox_ok(w,s,e,n):
    return -180<=w<e<=180 and -90<=s<n<=90

ISO3_RE = re.compile(r"^[A-Z]{3}$")


FIELD_MAPPINGS = {
    "latitude": ["latitude", "lat"],
    "longitude": ["longitude", "lon", "long"],
    "bright_ti4": ["bright_ti4", "brightness", "bright_t31"],
    "bright_ti5": ["bright_ti5", "bright_t21", "bright_t22"],
    "frp": ["frp", "fire_radiative_power"],
    "acq_date": ["acq_date", "acquisition_date", "date"],
    "acq_time": ["acq_time", "acquisition_time", "time"],
    "confidence": ["confidence", "conf"],
    "satellite": ["satellite", "satellite_name"],
    "instrument": ["instrument", "instrument_name"],
    "daynight": ["daynight", "day_night"],
    "country_id": ["country_id", "country"],
}


def _transform_row(row: Dict, source: Optional[str] = None) -> Dict:
    """Apply field mappings and ensure required fields."""
    transformed: Dict[str, str] = {}
    for target, sources in FIELD_MAPPINGS.items():
        for src in sources:
            for key in row.keys():
                if key.lower() == src.lower():
                    transformed[target] = row[key]
                    break

    required = ["latitude", "longitude", "bright_ti4", "acq_date", "acq_time"]
    for field in required:
        if field not in transformed:
            transformed[field] = ""
    if source:
        transformed["source"] = source
    return transformed

async def _fetch_firms_data_async(
    url: str, client: httpx.AsyncClient, source: str, retries: int = 3
) -> List[Dict]:
    """异步获取并转换 FIRMS 数据，带指数退避与429处理"""
    attempt = 0
    backoff_base = 1.5
    while True:
        attempt += 1
        try:
            resp = await client.get(url, timeout=120)
            resp.raise_for_status()
            logger.info(
                "firms_request",
                extra={"url": url, "status_code": resp.status_code, "retries": attempt - 1},
            )
            text = resp.text
            lower_head = " ".join(text.splitlines()[:2]).lower()
            if "invalid map_key" in lower_head or "invalid api call" in lower_head or "unauthorized" in lower_head:
                raise HTTPExceptionFactory.service_unavailable(
                    "Invalid or unauthorized FIRMS MAP_KEY (data fetch). Please update backend/.env"
                )
            reader = csv.DictReader(io.StringIO(text))
            transformed_data = []
            for row in reader:
                if not any(row.values()):
                    continue
                transformed_data.append(_transform_row(row, source))
            return transformed_data
        except httpx.TimeoutException as e:
            logger.warning(
                "firms_timeout",
                extra={"url": url, "status_code": None, "retries": attempt - 1},
            )
            if attempt >= retries:
                raise HTTPExceptionFactory.gateway_timeout(
                    f"FIRMS request timeout: {str(e)}. "
                    "Server is processing large amounts of data, please try again later.",
                )
        except httpx.HTTPError as e:
            status = e.response.status_code if isinstance(e, httpx.HTTPStatusError) and e.response else getattr(e, "status_code", None)
            logger.warning(
                "firms_error",
                extra={"url": url, "status_code": status, "retries": attempt - 1},
            )
            if status == 404:
                return []
            if status == 429:
                # Quota exceeded: surface as 503 with friendly message
                raise HTTPExceptionFactory.service_unavailable(
                    "FIRMS quota exceeded (429). Please reduce request frequency or wait a few minutes."
                )
            if attempt >= retries:
                raise HTTPExceptionFactory.bad_gateway(
                    f"FIRMS request failed: {str(e)}. "
                    "If failing repeatedly, try reducing the time span or using coordinate query.",
                )
        # backoff before retry if we will retry
        await asyncio.sleep(min(30, (backoff_base ** (attempt - 1))))


async def _stream_firms_data_async(
    url: str, client: httpx.AsyncClient, source: str
) -> AsyncGenerator[Dict, None]:
    """Stream FIRMS CSV data and yield transformed rows."""
    async with client.stream("GET", url, timeout=120) as resp:
        resp.raise_for_status()
        header: Optional[List[str]] = None
        async for line in resp.aiter_lines():
            if not line:
                continue
            if header is None:
                header = next(csv.reader([line]))
                continue
            values = next(csv.reader([line]))
            row = dict(zip(header, values))
            if not any(row.values()):
                continue
            yield _transform_row(row, source)


def compute_stats(
    points: List[Dict], frp_mid: float = 5, frp_high: float = 20
) -> Dict[str, Any]:
    """Aggregate fire point statistics."""
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
        "frpHighCount": 0,
        "frpMidCount": 0,
        "frpLowCount": 0,
    }
    if total == 0:
        return stats

    for p in points:
        frp = float(p.get("frp") or 0)
        stats["sumFrp"] += frp
        stats["maxFrp"] = max(stats["maxFrp"], frp)
        if frp >= frp_high:
            stats["frpHighCount"] += 1
        elif frp >= frp_mid:
            stats["frpMidCount"] += 1
        else:
            stats["frpLowCount"] += 1

        if p.get("daynight", "").upper() == "D":
            stats["dayCount"] += 1
        else:
            stats["nightCount"] += 1

        conf = str(p.get("confidence", "")).lower()
        if conf == "h" or (conf.isdigit() and int(conf) >= 80):
            stats["highConfidence"] += 1
        elif conf == "n" or (conf.isdigit() and int(conf) >= 30):
            stats["mediumConfidence"] += 1
        else:
            stats["lowConfidence"] += 1

        sat = (p.get("satellite") or "").upper()
        if sat.startswith("N"):
            stats["viirsCount"] += 1
        elif sat == "T":
            stats["terraCount"] += 1
        else:
            stats["aquaCount"] += 1

    stats["avgFrp"] = stats["sumFrp"] / total if total else 0.0
    return stats


def _prepare_fire_query(
    country: Optional[str],
    west: Optional[float],
    south: Optional[float],
    east: Optional[float],
    north: Optional[float],
    start_date: Optional[str],
    end_date: Optional[str],
    source_priority: Optional[str],
    response: Response,
    availability: Dict[str, Tuple[str, str]],
) -> Optional[Tuple[List[str], str]]:
    """Validate parameters and compose request URLs."""
    requested_country_mode = False
    if country:
        requested_country_mode = True
        country = country.upper()
        if not ISO3_RE.fullmatch(country):
            raise HTTPExceptionFactory.bad_request(
                "Country code must be ISO-3 (3 uppercase letters)"
            )

    if None not in (west, south, east, north):
        if not _bbox_ok(west, south, east, north):
            raise HTTPExceptionFactory.bad_request("Invalid coordinate range")
        requested_country_mode = False
    elif country:
        # Derive bbox from ISO3 for country mode (v4 country endpoint is not available)
        bbox = COUNTRY_BBOX.get(country)
        if not bbox:
            raise HTTPExceptionFactory.bad_request(
                "Unknown or unsupported ISO-3 country code; please use bbox coordinates"
            )
        west, south, east, north = bbox
    else:
        raise HTTPExceptionFactory.bad_request("Must provide either country code or complete coordinate range")

    start = _parse_date(start_date)
    end = _parse_date(end_date)
    now = datetime.utcnow().date()
    if start > end:
        raise HTTPExceptionFactory.bad_request(
            "Start date must not be later than end date"
        )
    if end > now:
        raise HTTPExceptionFactory.bad_request(
            "End date cannot exceed today"
        )

    priorities = (
        [s.strip().upper() for s in source_priority.split(",")]
        if source_priority
        else DEFAULT_SOURCE_PRIORITY
    )
    selected_source: Optional[str] = None
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
        response.headers[
            "X-Data-Availability"
        ] = "No data available for requested date range"
        return None

    # Always use area URLs (bbox or derived country bbox)
    urls = compose_urls(
        MAP_KEY,
        selected_source,
        start,
        end,
        area=(west, south, east, north),
    )

    # Log composed URLs for observability
    for u in urls:
        logger.info("firms_composed_url", extra={"url": u})

    return urls, selected_source


async def _fetch_deduped_data(
    urls: List[str], selected_source: str, max_concurrency: int
) -> List[Dict]:
    """Fetch all URLs concurrently and deduplicate records."""
    headers = {"Accept-Encoding": "gzip, deflate"}
    async with httpx.AsyncClient(headers=headers) as client:
        sem = asyncio.Semaphore(max(1, max_concurrency))

        async def fetch(url: str) -> List[Dict]:
            async with sem:
                return await _fetch_firms_data_async(url, client, selected_source)

        tasks = [asyncio.create_task(fetch(u)) for u in urls]
        results = await asyncio.gather(*tasks)

    merged: List[Dict] = []
    for r in results:
        merged.extend(r)

    deduped: List[Dict] = []
    seen = set()
    for row in merged:
        key = (
            row.get("acq_date"),
            row.get("acq_time"),
            row.get("latitude"),
            row.get("longitude"),
            row.get("source"),
        )
        if key not in seen:
            seen.add(key)
            deduped.append(row)
    return deduped

# ---------- Core Routes ----------
@app.get("/")
async def root():
    return {"message": "Welcome to Wildfire Visualization API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}



@app.get("/fires")
async def get_fires(
    request: Request,
    response: Response,
    country: Optional[str] = Query(None),
    west: Optional[float] = None,
    south: Optional[float] = None,
    east: Optional[float] = None,
    north: Optional[float] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    source_priority: Optional[str] = Query(
        None, alias="sourcePriority"
    ),
    format: str = Query("geojson", pattern=r"^(json|geojson)$"),
    max_concurrency: int = Query(MAX_CONCURRENT_REQUESTS, alias="maxConcurrency", ge=1, le=20),
):
    # Ensure FIRMS MAP key configured
    if not MAP_KEY:
        raise HTTPExceptionFactory.service_unavailable("FIRMS_MAP_KEY is not configured on the server")

    try:
        availability = await asyncio.to_thread(check_data_availability, MAP_KEY, "ALL")
    except Exception as e:
        raise HTTPExceptionFactory.service_unavailable(
            "Invalid or unauthorized FIRMS MAP_KEY. Please update backend/.env",
            details=str(e),
        )

    prepared = _prepare_fire_query(
        country,
        west,
        south,
        east,
        north,
        start_date,
        end_date,
        source_priority,
        response,
        availability,
    )
    if not prepared:
        # Honor requested format even in early-return path
        return to_geojson([]) if format == "geojson" else []
    urls, selected_source = prepared

    if "application/x-ndjson" in request.headers.get("accept", ""):
        async def ndjson_stream() -> AsyncGenerator[bytes, None]:
            seen = set()
            headers = {"Accept-Encoding": "gzip, deflate"}
            async with httpx.AsyncClient(headers=headers) as client:
                for url in urls:
                    async for row in _stream_firms_data_async(
                        url, client, selected_source
                    ):
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

        return StreamingResponse(ndjson_stream(), media_type="application/x-ndjson")

    deduped = await _fetch_deduped_data(urls, selected_source, max_concurrency)
    if format == "geojson":
        return to_geojson(deduped)
    return deduped

@app.get("/fires/stats")
async def get_fire_stats(
    response: Response,
    country: Optional[str] = Query(None),
    west: Optional[float] = None,
    south: Optional[float] = None,
    east: Optional[float] = None,
    north: Optional[float] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    source_priority: Optional[str] = Query(
        None, alias="sourcePriority"
    ),
    frp_high: float = Query(20, alias="frpHigh"),
    frp_mid: float = Query(5, alias="frpMid"),
    max_concurrency: int = Query(MAX_CONCURRENT_REQUESTS, alias="maxConcurrency", ge=1, le=20),
) -> Dict[str, Any]:
    # Ensure FIRMS MAP key configured
    if not MAP_KEY:
        raise HTTPExceptionFactory.service_unavailable("FIRMS_MAP_KEY is not configured on the server")

    try:
        availability = await asyncio.to_thread(check_data_availability, MAP_KEY, "ALL")
    except Exception as e:
        raise HTTPExceptionFactory.service_unavailable(
            "Invalid or unauthorized FIRMS MAP_KEY. Please update backend/.env",
            details=str(e),
        )

    prepared = _prepare_fire_query(
        country,
        west,
        south,
        east,
        north,
        start_date,
        end_date,
        source_priority,
        response,
        availability,
    )
    data: List[Dict] = []
    if prepared:
        urls, selected_source = prepared
        data = await _fetch_deduped_data(urls, selected_source, max_concurrency)
    return compute_stats(data, frp_mid, frp_high)

    # Removed debug endpoints for production hardening
