import os
import csv
import io
import json
import asyncio
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple

import httpx
import requests
import logging
from fastapi import FastAPI, Query, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from requests.adapters import HTTPAdapter

from services.geo import validate_country, country_to_bbox
from utils.data_availability import check_data_availability
from utils.urlbuilder import compose_urls
from utils.geojson import to_geojson
from utils.http_exceptions import HTTPExceptionFactory

# Configure CORS
load_dotenv()
logger = logging.getLogger(__name__)
app = FastAPI(title="Wildfire Visualization API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],  # More permissive during development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# NASA FIRMS API configuration
MAP_KEY = os.getenv("FIRMS_MAP_KEY")
if not MAP_KEY:
    MAP_KEY = os.getenv("FIRMS_API_KEY")
    if MAP_KEY:
        print("Warning: environment variable FIRMS_API_KEY is deprecated, please use FIRMS_MAP_KEY")
if not MAP_KEY:
    MAP_KEY = "5d12184bae5da99a286386dd6e04de14"
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
    "VIIRS_NOAA21_NRT",
    "VIIRS_NOAA20_NRT",
    "VIIRS_SNPP_NRT",
    "MODIS_NRT",
    "VIIRS_NOAA21_SP",
    "VIIRS_NOAA20_SP",
    "VIIRS_SNPP_SP",
    "MODIS_SP",
]

MAX_CONCURRENT_REQUESTS = 5

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

def _fetch_firms_data(url: str, retries: int = 3) -> List[Dict]:
    """Fetch data from FIRMS API, return empty list if only headers exist."""
    attempt = 0
    while True:
        attempt += 1
        try:
            resp = requests.get(url, timeout=(30, 120))
            resp.raise_for_status()
            logger.info(
                "firms_request",
                extra={"url": url, "status_code": resp.status_code, "retries": attempt - 1},
            )
            reader = csv.DictReader(io.StringIO(resp.text))
            transformed_data = []
            for row in reader:
                if not any(row.values()):
                    continue
                transformed_data.append(_transform_row(row))
            return transformed_data
        except requests.Timeout as e:
            logger.warning(
                "firms_timeout",
                extra={"url": url, "status_code": None, "retries": attempt - 1},
            )
            if attempt >= retries:
                raise HTTPExceptionFactory.gateway_timeout(
                    f"FIRMS request timeout: {str(e)}. "
                    "Server is processing large amounts of data, please try again later."
                )
        except requests.RequestException as e:
            status = e.response.status_code if isinstance(e, requests.HTTPError) and e.response else None
            logger.warning(
                "firms_error",
                extra={"url": url, "status_code": status, "retries": attempt - 1},
            )
            if isinstance(e, requests.exceptions.HTTPError) and status == 404:
                return []
            if attempt >= retries:
                raise HTTPExceptionFactory.bad_gateway(
                    f"FIRMS request failed: {str(e)}. "
                    "If failing repeatedly, try reducing the time span or using coordinate query."
                )


async def _fetch_firms_data_async(
    url: str, client: httpx.AsyncClient, source: str, retries: int = 3
) -> List[Dict]:
    """异步获取并转换 FIRMS 数据"""
    attempt = 0
    while True:
        attempt += 1
        try:
            resp = await client.get(url, timeout=120)
            resp.raise_for_status()
            logger.info(
                "firms_request",
                extra={"url": url, "status_code": resp.status_code, "retries": attempt - 1},
            )
            reader = csv.DictReader(io.StringIO(resp.text))
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
            status = e.response.status_code if isinstance(e, httpx.HTTPStatusError) and e.response else None
            logger.warning(
                "firms_error",
                extra={"url": url, "status_code": status, "retries": attempt - 1},
            )
            if isinstance(e, httpx.HTTPStatusError) and status == 404:
                return []
            if attempt >= retries:
                raise HTTPExceptionFactory.bad_gateway(
                    f"FIRMS request failed: {str(e)}. "
                    "If failing repeatedly, try reducing the time span or using coordinate query.",
                )


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
) -> Optional[Tuple[List[str], str]]:
    """Validate parameters and compose request URLs."""
    if country:
        country = country.upper()
        if not validate_country(country):
            raise HTTPExceptionFactory.bad_request("Invalid ISO-3 country code")

    if None not in (west, south, east, north):
        if not _bbox_ok(west, south, east, north):
            raise HTTPExceptionFactory.bad_request("Invalid coordinate range")
    elif country:
        bbox = country_to_bbox(country)
        if not bbox:
            raise HTTPExceptionFactory.bad_request("Invalid ISO-3 country code")
        west, south, east, north = bbox
    else:
        raise HTTPExceptionFactory.bad_request(
            "Must provide either country code or complete coordinate range"
        )

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
    availability = check_data_availability(MAP_KEY, "ALL")
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

    urls = compose_urls(
        MAP_KEY,
        selected_source,
        start,
        end,
        area=(west, south, east, north),
    )
    return urls, selected_source


async def _fetch_deduped_data(
    urls: List[str], selected_source: str
) -> List[Dict]:
    """Fetch all URLs concurrently and deduplicate records."""
    async with httpx.AsyncClient() as client:
        sem = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

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

@app.get("/debug")
async def debug_endpoint():
    """Debug endpoint to check raw response from FIRMS API"""
    try:
        # Use a known good request to USA for a short date range using v4 endpoint
        url = (
            "https://firms.modaps.eosdis.nasa.gov/api/country/csv/"
            f"{MAP_KEY}/VIIRS_SNPP_NRT/USA/1/2023-07-01"
        )
        session = requests.Session()
        session.mount("https://", requests.adapters.HTTPAdapter(max_retries=3))
        resp = session.get(url, timeout=(30, 120))
        resp.raise_for_status()
        
        # Parse the first few rows of CSV data to see structure
        data = list(csv.DictReader(io.StringIO(resp.text)))[:5]
        
        # Return debug information
        return {
            "status": resp.status_code,
            "content_type": resp.headers.get('Content-Type', ''),
            "sample_data": data,
            "column_names": list(data[0].keys()) if data else [],
            "transformed_sample": _fetch_firms_data(url)[:5]
        }
    except Exception as e:
        return {"error": str(e)}

        return to_geojson(deduped)
    return deduped

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
    format: str = Query("json", regex="^(json|geojson)$"),
):
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
    )
    if not prepared:
        return []
    urls, selected_source = prepared

    if "application/x-ndjson" in request.headers.get("accept", ""):
        async def ndjson_stream() -> AsyncGenerator[bytes, None]:
            seen = set()
            async with httpx.AsyncClient() as client:
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

    deduped = await _fetch_deduped_data(urls, selected_source)
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
) -> Dict[str, Any]:
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
    )
    data: List[Dict] = []
    if prepared:
        urls, selected_source = prepared
        data = await _fetch_deduped_data(urls, selected_source)
    return compute_stats(data, frp_mid, frp_high)

@app.get("/cors-test")
async def cors_test():
    """Test endpoint to verify CORS is working properly"""
    return {
        "status": "success",
        "message": "CORS is properly configured",
        "allow_origins": ["http://localhost:3000"],
        "test_data": [
            {"latitude": "34.0522", "longitude": "-118.2437", "bright_ti4": "310.5", 
             "acq_date": "2023-07-01", "acq_time": "1200"}
        ]
    } 

@app.get("/debug-bbox")
async def debug_bbox_endpoint():
    """Debug endpoint to check BBOX API calls"""
    try:
        # Use sample boundary coordinates for testing
        west = -100.0
        south = 30.0
        east = -80.0
        north = 40.0
        day_range = 1
        start_date = "2023-07-01"
        
        # Build API URL - use 'area' instead of 'bbox' endpoint
        base_url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}"

        # Construct the URL according to v4 specs
        nrt_url = f"{base_url}/VIIRS_SNPP_NRT/{west},{south},{east},{north}/{day_range}/{start_date}"
        sp_url = f"{base_url}/VIIRS_SNPP_SP/{west},{south},{east},{north}/{day_range}/{start_date}"
        
        # Try calling the API
        session = requests.Session()
        session.mount("https://", requests.adapters.HTTPAdapter(max_retries=3))
        
        # Test the response of a single API call
        resp = session.get(nrt_url, timeout=(30, 120))
        
        # Return debug information
        return {
            "nrt_url": nrt_url,
            "sp_url": sp_url,
            "status_code": resp.status_code,
            "content_type": resp.headers.get('Content-Type', ''),
            "raw_response": resp.text[:500] if resp.status_code == 200 else resp.text,
            "transformed_sample": _fetch_firms_data(nrt_url)[:5] if resp.status_code == 200 else []
        }
    except Exception as e:
        return {"error": str(e), "type": str(type(e))} 
