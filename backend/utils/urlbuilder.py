"""URL 构建工具，用于生成 NASA FIRMS API v4 请求 URL。

该模块提供了针对 Country 与 Area 查询的 URL 拼接函数，
并支持根据日期区间拆分请求。所有函数均为纯函数，
便于单元测试与后续复用。
"""

from datetime import date, timedelta
from typing import List, Optional, Tuple, Union

BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api"


def build_country_url(
    map_key: str,
    source: str,
    country: str,
    day_range: int,
    start: Optional[date] = None,
) -> str:
    """构造 Country 查询的 URL。

    Args:
        map_key: FIRMS 提供的 MAP_KEY。
        source: 数据源名称。
        country: ISO‑3 国家代码。
        day_range: 查询的天数范围（1-10）。
        start: 起始日期，未提供则使用默认（今日）数据。

    Returns:
        拼接好的 URL 字符串。
    """

    path = f"/country/csv/{map_key}/{source}/{country}/{day_range}"
    if start:
        path += f"/{start.isoformat()}"
    return BASE_URL + path


def build_area_url(
    map_key: str,
    source: str,
    area: Union[str, Tuple[float, float, float, float]],
    day_range: int,
    start: Optional[date] = None,
) -> str:
    """构造 Area 查询的 URL。

    Args:
        map_key: FIRMS 提供的 MAP_KEY。
        source: 数据源名称。
        area: 传入 "world" 或 `(west, south, east, north)` 元组。
        day_range: 查询的天数范围（1-10）。
        start: 起始日期，未提供则使用默认（今日）数据。

    Returns:
        拼接好的 URL 字符串。
    """

    if area == "world":
        area_part = "world"
    else:
        w, s, e, n = area  # type: ignore[misc]
        area_part = f"{w},{s},{e},{n}"

    path = f"/area/csv/{map_key}/{source}/{area_part}/{day_range}"
    if start:
        path += f"/{start.isoformat()}"
    return BASE_URL + path


def compose_urls(
    map_key: str,
    source: str,
    start: date,
    end: date,
    country: Optional[str] = None,
    area: Union[Tuple[float, float, float, float], str, None] = None,
) -> List[str]:
    """根据日期区间生成一组请求 URL。

    若时间跨度超过 10 天，会按 10 天为上限拆分为多段。

    Args:
        map_key: FIRMS MAP_KEY。
        source: 数据源名称。
        start: 起始日期（包含）。
        end: 结束日期（包含）。
        country: ISO‑3 国家代码，与 `area` 二选一。
        area: "world" 或 `(west, south, east, north)`，与 `country` 二选一。

    Returns:
        覆盖整个日期区间的 URL 列表。
    """

    if (country is None) == (area is None):
        raise ValueError("provide exactly one of country or area")

    urls: List[str] = []
    cur = start
    while cur <= end:
        segment_end = min(cur + timedelta(days=9), end)
        day_range = (segment_end - cur).days + 1
        if country:
            url = build_country_url(map_key, source, country, day_range, cur)
        else:
            url = build_area_url(map_key, source, area, day_range, cur)  # type: ignore[arg-type]
        urls.append(url)
        cur = segment_end + timedelta(days=1)

    return urls
