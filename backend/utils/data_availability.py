import csv
from typing import Dict, Tuple
import requests


def _validate_text_for_errors(text: str) -> None:
    head = (text or "").splitlines()[:2]
    joined = " ".join(head).lower()
    if "invalid map_key" in joined or "invalid api call" in joined or "unauthorized" in joined:
        raise ValueError("Invalid or unauthorized FIRMS MAP_KEY (data_availability)")


def check_data_availability(map_key: str, sensor: str = "ALL") -> Dict[str, Tuple[str, str]]:
    """Return available date ranges for given sensor(s).

    Parameters
    ----------
    map_key: str
        NASA FIRMS MAP_KEY.
    sensor: str, default "ALL"
        Sensor dataset identifier or "ALL" for all datasets.

    Returns
    -------
    Dict[str, Tuple[str, str]]
        Mapping of dataset id to (min_date, max_date).
    """
    url = f"https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/{map_key}/{sensor}"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    _validate_text_for_errors(resp.text)
    reader = csv.DictReader(resp.text.splitlines())
    availability: Dict[str, Tuple[str, str]] = {}
    for row in reader:
        data_id = row.get("data_id")
        if data_id:
            availability[data_id] = (row.get("min_date", ""), row.get("max_date", ""))
    return availability
