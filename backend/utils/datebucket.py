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
    """将火灾数据按日期分组。
    
    Args:
        rows: 火灾数据列表，每项必须包含 acq_date 字段
        start: 开始日期（含）
        end: 结束日期（含）
        
    Returns:
        按日期分组的 OrderedDict，键为 ISO 格式日期字符串
        
    Raises:
        ValueError: 当日期范围无效或数据格式错误时
        TypeError: 当输入类型错误时
    """
    if rows is None:
        rows = []
        
    if start > end:
        raise ValueError("start date must not be later than end date")
        
    # 初始化日期桶
    bucket: OrderedDict[str, List[Dict[str, Any]]] = OrderedDict()
    cur = start
    while cur <= end:
        bucket[cur.isoformat()] = []
        cur += timedelta(days=1)
        
    # 填充数据
    for row in rows:
        if not isinstance(row, dict):
            raise TypeError(f"expected dict, got {type(row)}")
            
        acq_date = row.get("acq_date")
        if not acq_date:
            continue  # 跳过没有日期的记录
            
        if not isinstance(acq_date, str) or not ISO_DATE_RE.match(acq_date):
            continue  # 跳过日期格式不正确的记录
            
        if acq_date in bucket:
            bucket[acq_date].append(row)
            
    return bucket 