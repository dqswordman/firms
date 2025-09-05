from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

CONFIDENCE_MAP = {
    "l": 0,
    "low": 0,
    "n": 50,
    "nominal": 50,
    "m": 50,
    "medium": 50,
    "h": 100,
    "high": 100,
}


def _parse_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _normalize_confidence(raw: Any) -> int | None:
    if raw is None:
        return None
    text = str(raw).strip()
    if text.isdigit():
        num = int(text)
        return max(0, min(100, num))
    return CONFIDENCE_MAP.get(text.lower())


def _combine_datetime(date_str: str | None, time_str: str | None) -> str | None:
    if not date_str or not time_str:
        return None
    try:
        dt = datetime.strptime(f"{date_str} {time_str.zfill(4)}", "%Y-%m-%d %H%M")
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except ValueError:
        return None


def to_geojson(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Convert FIRMS records to GeoJSON FeatureCollection.

    Includes commonly used raw fields to maximize frontend compatibility.
    """
    features: List[Dict[str, Any]] = []
    for row in records:
        lat = _parse_float(row.get("latitude"))
        lon = _parse_float(row.get("longitude"))
        if lat is None or lon is None:
            continue

        # Brightness fields (prefer TI4 then TI5)
        bright_ti4 = _parse_float(row.get("bright_ti4"))
        bright_ti5 = _parse_float(row.get("bright_ti5"))
        brightness = bright_ti4 if bright_ti4 is not None else bright_ti5

        properties: Dict[str, Any] = {
            # Normalized/derived fields
            "brightness": brightness,
            "frp": _parse_float(row.get("frp")),
            "satellite": row.get("satellite"),
            "instrument": row.get("instrument"),
            "daynight": row.get("daynight"),
            "source": row.get("source"),
            "country_id": row.get("country_id"),
            "confidence": _normalize_confidence(row.get("confidence")),
            "confidence_text": row.get("confidence"),
            "acq_datetime": _combine_datetime(row.get("acq_date"), row.get("acq_time")),
            # Raw fields preserved for UI components
            "acq_date": row.get("acq_date"),
            "acq_time": row.get("acq_time"),
            "bright_ti4": row.get("bright_ti4"),
            "bright_ti5": row.get("bright_ti5"),
        }

        feature = {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": properties,
        }
        features.append(feature)
    return {"type": "FeatureCollection", "features": features}
