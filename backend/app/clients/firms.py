from __future__ import annotations

import csv
import io
import json
import logging
from dataclasses import dataclass
from typing import AsyncGenerator, Dict, Iterable, List, Optional

import httpx

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

logger = logging.getLogger(__name__)


@dataclass
class FIRMSClient:
    """HTTP client wrapper for FIRMS CSV endpoints."""

    timeout: int = 120

    async def fetch_records(
        self, url: str, source: str, *, client: Optional[httpx.AsyncClient] = None
    ) -> List[Dict]:
        own_client = False
        if client is None:
            client = httpx.AsyncClient(headers={"Accept-Encoding": "gzip, deflate"})
            own_client = True
        try:
            resp = await client.get(url, timeout=self.timeout)
            resp.raise_for_status()
            text = resp.text
            self._guard_invalid_key(text)
            reader = csv.DictReader(io.StringIO(text))
            return [self._transform_row(row, source) for row in reader if any(row.values())]
        finally:
            if own_client:
                await client.aclose()

    async def stream_records(
        self, url: str, source: str, *, client: httpx.AsyncClient
    ) -> AsyncGenerator[Dict, None]:
        async with client.stream("GET", url, timeout=self.timeout) as resp:
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
                yield self._transform_row(row, source)

    def _transform_row(self, row: Dict, source: Optional[str] = None) -> Dict:
        transformed: Dict[str, str] = {}
        for target, sources in FIELD_MAPPINGS.items():
            for src in sources:
                for key in row.keys():
                    if key.lower() == src.lower():
                        transformed[target] = row[key]
                        break

        required = ["latitude", "longitude", "bright_ti4", "acq_date", "acq_time"]
        for field in required:
            transformed.setdefault(field, "")
        if source:
            transformed["source"] = source
        return transformed

    @staticmethod
    def _guard_invalid_key(text: str) -> None:
        lower_head = " ".join(text.splitlines()[:2]).lower()
        if "invalid map_key" in lower_head or "invalid api call" in lower_head or "unauthorized" in lower_head:
            from utils.http_exceptions import HTTPExceptionFactory

            raise HTTPExceptionFactory.service_unavailable(
                "Invalid or unauthorized FIRMS MAP_KEY. Please update backend/.env"
            )


def deduplicate(records: Iterable[Dict]) -> List[Dict]:
    seen = set()
    result: List[Dict] = []
    for row in records:
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
        result.append(row)
    return result

