import os
import csv
import io
import requests
from datetime import datetime
from typing import Optional, List, Dict
from fastapi import FastAPI, Query, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from requests.adapters import HTTPAdapter
from services.geo import validate_country, country_to_bbox
from utils.data_availability import check_data_availability

# Configure CORS
load_dotenv()
app = FastAPI(title="Wildfire Visualization API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],  # More permissive during development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

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

# ---------- Utility Functions ----------
def _parse_date(d: Optional[str]) -> datetime.date:
    if d is None:
        return datetime.utcnow().date()
    try:
        return datetime.strptime(d, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(400, "Date format must be YYYY-MM-DD")

def _bbox_ok(w,s,e,n):
    return -180<=w<e<=180 and -90<=s<n<=90

def _fetch_firms_data(url: str) -> List[Dict]:
    """Fetch data from FIRMS API, return empty list if only headers exist"""
    try:
        session = requests.Session()
        session.mount("https://", requests.adapters.HTTPAdapter(max_retries=3))
        resp = session.get(url, timeout=(30, 120))   # 30s connect, 120s read
        resp.raise_for_status()
        
        # Parse CSV data
        data = list(csv.DictReader(io.StringIO(resp.text)))
        # If only headers exist (single row with all empty values), return empty list
        if len(data) == 1 and all(not v for v in data[0].values()):
            return []
            
        # Transform data to match frontend expected format
        transformed_data = []
        for row in data:
            transformed_row = {}
            
            # Map common field name variations
            field_mappings = {
                'latitude': ['latitude', 'lat'],
                'longitude': ['longitude', 'lon', 'long'],
                'bright_ti4': ['bright_ti4', 'brightness', 'bright_t31'],
                'bright_ti5': ['bright_ti5', 'bright_t21', 'bright_t22'],
                'frp': ['frp', 'fire_radiative_power'],
                'acq_date': ['acq_date', 'acquisition_date', 'date'],
                'acq_time': ['acq_time', 'acquisition_time', 'time'],
                'confidence': ['confidence', 'conf'],
                'satellite': ['satellite', 'satellite_name'],
                'instrument': ['instrument', 'instrument_name'],
                'daynight': ['daynight', 'day_night'],
            }
            
            # Apply field mappings
            for target_field, source_fields in field_mappings.items():
                for source in source_fields:
                    for key in row.keys():
                        if key.lower() == source.lower():
                            transformed_row[target_field] = row[key]
                            break
            
            # Ensure all required fields exist
            required_fields = ['latitude', 'longitude', 'bright_ti4', 'acq_date', 'acq_time']
            for field in required_fields:
                if field not in transformed_row:
                    transformed_row[field] = ""
            
            transformed_data.append(transformed_row)
            
        return transformed_data
    except requests.Timeout as e:
        raise HTTPException(
            504,
            f"FIRMS request timeout: {str(e)}. "
            "Server is processing large amounts of data, please try again later."
        )
    except requests.RequestException as e:
        if isinstance(e, requests.exceptions.HTTPError) and e.response.status_code == 404:
            return []
        raise HTTPException(
            502,
            f"FIRMS request failed: {str(e)}. "
            "If failing repeatedly, try reducing the time span or using coordinate query."
        )

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

@app.get("/fires", response_model=List[Dict])
def get_fires(
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
):
    # 1) Validate and prepare query region
    if country:
        country = country.upper()
        if not validate_country(country):
            raise HTTPException(400, "Invalid ISO-3 country code")

    if None not in (west, south, east, north):
        if not _bbox_ok(west, south, east, north):
            raise HTTPException(400, "Invalid coordinate range")
    elif country:
        bbox = country_to_bbox(country)
        if not bbox:
            raise HTTPException(400, "Invalid ISO-3 country code")
        west, south, east, north = bbox
    else:
        raise HTTPException(400, "Must provide either country code or complete coordinate range")

    # 2) Process dates
    start = _parse_date(start_date)
    end = _parse_date(end_date)
    now = datetime.utcnow().date()

    # Basic date rule checks
    if start > end:
        raise HTTPException(400, "Start date must not be later than end date")
    if end > now:
        raise HTTPException(400, "End date cannot exceed today")
    if (end - start).days > 9:  # Maximum span is 10 days (inclusive)
        raise HTTPException(400, "Time span cannot exceed 10 days")

    # 3) Determine data source based on availability
    priorities = (
        [s.strip().upper() for s in source_priority.split(",")]
        if source_priority
        else DEFAULT_SOURCE_PRIORITY
    )
    availability = check_data_availability(MAP_KEY, "ALL")
    selected_source = None
    for src in priorities:
        if src not in SOURCE_WHITELIST:
            continue
        if src not in availability:
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
        return []

    # 4) Construct FIRMS v4 URL using area query
    fmt = "csv"
    day_range = (end - start).days + 1
    url = (
        f"https://firms.modaps.eosdis.nasa.gov/api/area/{fmt}/"
        f"{MAP_KEY}/{selected_source}/{west},{south},{east},{north}/{day_range}/{start.isoformat()}"
    )

    print(f"FIRMS request URL: {url}")
    return _fetch_firms_data(url)

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
