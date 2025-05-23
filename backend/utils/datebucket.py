from collections import OrderedDict
from datetime import date, timedelta
from typing import List, Dict, Any, Optional
import re

# ISO date format regex (YYYY-MM-DD)
ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

def bucket_by_date(
    rows: Optional[List[Dict[str, Any]]],
    start: date,
    end: date,
) -> OrderedDict[str, List[Dict[str, Any]]]:
    """Group wildfire data by date.
    
    Args:
        rows: List of wildfire data, each item must contain acq_date field
        start: Start date (inclusive)
        end: End date (inclusive)
        
    Returns:
        OrderedDict grouped by date, with ISO format date strings as keys
        
    Raises:
        ValueError: When date range is invalid or data format is incorrect
        TypeError: When input type is incorrect
    """
    if rows is None:
        rows = []
        
    if start > end:
        raise ValueError("start date must not be later than end date")
        
    # Initialize date buckets
    bucket: OrderedDict[str, List[Dict[str, Any]]] = OrderedDict()
    cur = start
    while cur <= end:
        bucket[cur.isoformat()] = []
        cur += timedelta(days=1)
        
    # Fill data
    for row in rows:
        if not isinstance(row, dict):
            raise TypeError(f"expected dict, got {type(row)}")
            
        acq_date = row.get("acq_date")
        if not acq_date:
            continue  # Skip records without date
            
        if not isinstance(acq_date, str) or not ISO_DATE_RE.match(acq_date):
            continue  # Skip records with incorrect date format
            
        if acq_date in bucket:
            bucket[acq_date].append(row)
            
    return bucket 