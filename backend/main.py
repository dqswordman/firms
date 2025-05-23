import os
import re
import csv
import io
import requests
from datetime import datetime
from typing import Optional, List, Dict
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from requests.adapters import HTTPAdapter

# Configure CORS
load_dotenv()
app = FastAPI(title="Wildfire Visualization API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React development server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NASA FIRMS API configuration
MAP_KEY = os.getenv("FIRMS_API_KEY", "5d12184bae5da99a286386dd6e04de14")
ISO3_RE = re.compile(r"^[A-Z]{3}$")

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

def _pick_source(start: datetime.date) -> str:
    """Use SP dataset if >7 days old, otherwise use NRT"""
    days_old = (datetime.utcnow().date() - start).days
    return "VIIRS_SNPP_SP" if days_old > 7 else "VIIRS_SNPP_NRT"

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
        return data
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

# ---------- 核心路由 ----------
@app.get("/")
async def root():
    return {"message": "Welcome to Wildfire Visualization API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/fires", response_model=List[Dict])
def get_fires(
    country: Optional[str] = Query(None),
    west:  Optional[float] = None,
    south: Optional[float] = None,
    east:  Optional[float] = None,
    north: Optional[float] = None,
    start_date: Optional[str] = None,
    end_date:   Optional[str] = None,
):
    # 1) Determine query mode
    if country:
        mode = "country"
        if not ISO3_RE.fullmatch(country.upper()):
            raise HTTPException(400, "Country code must be 3 uppercase letters")
    elif None not in (west,south,east,north):
        mode = "bbox"
        if not _bbox_ok(west,south,east,north):
            raise HTTPException(400, "Invalid coordinate range")
    else:
        raise HTTPException(400, "Must provide either country code or complete coordinate range")

    # 2) Process dates
    start = _parse_date(start_date)
    end   = _parse_date(end_date)
    now = datetime.utcnow().date()

    # Basic date rule checks
    if start > end:
        raise HTTPException(400, "Start date must not be later than end date")
    if end > now:
        raise HTTPException(400, "End date cannot exceed today")
    if (end - start).days > 9:  # Maximum span is 10 days (inclusive)
        raise HTTPException(400, "Time span cannot exceed 10 days")

    # 3) Construct FIRMS URL
    fmt = "csv"             # Official /country /area endpoints only support csv
    base = f"https://firms.modaps.eosdis.nasa.gov/api/{mode}/{fmt}/{MAP_KEY}"
    
    # Build query parameters
    day_range = (end - start).days + 1
    if mode == "country":
        query_params = f"/{country.upper()}/{day_range}/{start.isoformat()}"
    else:
        bbox = f"{west},{south},{east},{north}"
        query_params = f"/{bbox}/{day_range}/{start.isoformat()}"

    # 4) Try NRT data first
    nrt_url = f"{base}/VIIRS_SNPP_NRT{query_params}"
    nrt_data = _fetch_firms_data(nrt_url)
    
    # If NRT has data, return directly
    if nrt_data:
        return nrt_data
    
    # 5) If no NRT data, try SP data
    sp_url = f"{base}/VIIRS_SNPP_SP{query_params}"
    sp_data = _fetch_firms_data(sp_url)
    
    # If no SP data either, return empty array
    return sp_data 
