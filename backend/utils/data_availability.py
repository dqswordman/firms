import csv
import threading
import time
from typing import Dict, Tuple, Optional

import requests

_CACHE: Dict[Tuple[str, str], Tuple[float, Dict[str, Tuple[str, str]]]] = {}
_CACHE_TTL_SECONDS = 600
_CACHE_LOCK = threading.Lock()


def _clone(data: Dict[str, Tuple[str, str]]) -> Dict[str, Tuple[str, str]]:
    """Return a shallow copy so callers cannot mutate the cache payload."""
    return {key: (value[0], value[1]) for key, value in data.items()}


def _get_cached(key: Tuple[str, str], ttl_seconds: int) -> Optional[Dict[str, Tuple[str, str]]]:
    now = time.time()
    with _CACHE_LOCK:
        cached = _CACHE.get(key)
    if not cached:
        return None
    timestamp, payload = cached
    if now - timestamp > ttl_seconds:
        with _CACHE_LOCK:
            _CACHE.pop(key, None)
        return None
    return _clone(payload)


def _store_cache(key: Tuple[str, str], payload: Dict[str, Tuple[str, str]]) -> None:
    with _CACHE_LOCK:
        _CACHE[key] = (time.time(), _clone(payload))


def _validate_text_for_errors(text: str) -> None:
    head = (text or "").splitlines()[:2]
    joined = " ".join(head).lower()
    if "invalid map_key" in joined or "invalid api call" in joined or "unauthorized" in joined:
        raise ValueError("Invalid or unauthorized FIRMS MAP_KEY (data_availability)")


def check_data_availability(
    map_key: str,
    sensor: str = "ALL",
    *,
    force_refresh: bool = False,
    cache_ttl: int = _CACHE_TTL_SECONDS,
) -> Dict[str, Tuple[str, str]]:
    """Return available date ranges for given sensor(s).

    Parameters
    ----------
    map_key: str
        NASA FIRMS MAP_KEY.
    sensor: str, default "ALL"
        Sensor dataset identifier or "ALL" for all datasets.
    force_refresh: bool, default False
        When True, bypass any cached entry and fetch from FIRMS.
    cache_ttl: int, default 600
        Time-to-live for cached availability responses (seconds).

    Returns
    -------
    Dict[str, Tuple[str, str]]
        Mapping of dataset id to (min_date, max_date).
    """
    normalized_sensor = sensor.upper() if sensor else "ALL"
    cache_key = (map_key, normalized_sensor)

    if not force_refresh:
        cached = _get_cached(cache_key, cache_ttl)
        if cached is not None:
            return cached

    url = f"https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/{map_key}/{normalized_sensor}"
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise ValueError("Failed to fetch FIRMS data availability") from exc

    _validate_text_for_errors(resp.text)
    reader = csv.DictReader(resp.text.splitlines())
    availability: Dict[str, Tuple[str, str]] = {}
    for row in reader:
        data_id = row.get("data_id")
        if data_id:
            availability[data_id] = (row.get("min_date", ""), row.get("max_date", ""))

    _store_cache(cache_key, availability)
    return _clone(availability)

