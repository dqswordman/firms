import re
import time
from typing import Dict, Tuple, Optional

import requests

ISO3_RE = re.compile(r"^[A-Z]{3}$")
BOX_RE = re.compile(
    r"BOX\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)"
)

_country_cache: Dict[str, Tuple[float, float, float, float]] = {}
_cache_expiry: float = 0.0


def load_countries(cache_ttl: int = 86400) -> Dict[str, Tuple[float, float, float, float]]:
    """Load country metadata from NASA FIRMS, caching results for cache_ttl seconds."""
    global _country_cache, _cache_expiry
    now = time.time()
    if now < _cache_expiry and _country_cache:
        return _country_cache

    url = "https://firms.modaps.eosdis.nasa.gov/api/countries/"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    lines = resp.text.strip().splitlines()
    countries: Dict[str, Tuple[float, float, float, float]] = {}
    for line in lines[1:]:  # skip header
        parts = line.split(";")
        if len(parts) != 4:
            continue
        _, code, _name, extent = parts
        match = BOX_RE.match(extent)
        if not match:
            continue
        w, s, e, n = map(float, match.groups())
        countries[code.upper()] = (w, s, e, n)

    _country_cache = countries
    _cache_expiry = now + cache_ttl
    return countries


def validate_country(code: str) -> bool:
    """Return True if code is a valid ISO-3 country present in the list."""
    if not ISO3_RE.fullmatch(code.upper()):
        return False
    countries = load_countries()
    return code.upper() in countries


def country_to_bbox(code: str) -> Optional[Tuple[float, float, float, float]]:
    """Return bounding box (w, s, e, n) for the given ISO-3 code, if available."""
    countries = load_countries()
    return countries.get(code.upper())
