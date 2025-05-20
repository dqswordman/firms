import os, re, csv, io, requests
from datetime import datetime
from typing import Optional, List, Dict
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configure CORS
app = FastAPI(title="Wildfire Visualization API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React development server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NASA FIRMS API configuration
MAP_KEY = "5d12184bae5da99a286386dd6e04de14"
ISO3_RE = re.compile(r"^[A-Z]{3}$")

# ---------- 工具函数 ----------
def _parse_date(d: Optional[str]) -> datetime.date:
    if d is None:
        return datetime.utcnow().date()
    try:
        return datetime.strptime(d, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(400, "日期格式必须为 YYYY-MM-DD")

def _bbox_ok(w,s,e,n):
    return -180<=w<e<=180 and -90<=s<n<=90

def _pick_source(start: datetime.date) -> str:
    """距离今天 >7 天用 SP 数据集，否则 NRT"""
    days_old = (datetime.utcnow().date() - start).days
    return "VIIRS_SNPP_SP" if days_old > 7 else "VIIRS_SNPP_NRT"

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
    # 1) 判定查询模式
    if country:
        mode = "country"
        if not ISO3_RE.fullmatch(country.upper()):
            raise HTTPException(400, "国家代码需为 3 位大写字母")
    elif None not in (west,south,east,north):
        mode = "bbox"
        if not _bbox_ok(west,south,east,north):
            raise HTTPException(400, "经纬度范围非法")
    else:
        raise HTTPException(400, "必须提供国家代码或完整坐标范围")

    # 2) 处理日期
    start = _parse_date(start_date)
    end   = _parse_date(end_date)
    if start > end:
        raise HTTPException(400, "start_date 不能晚于 end_date")
    day_range = (end-start).days + 1
    if day_range > 10:
        raise HTTPException(400, "时间跨度不能超过 10 天")

    # 3) 组装 FIRMS URL
    source = _pick_source(start)
    fmt = "csv"             # 官方 /country /area 端点仅支持 csv
    base = f"https://firms.modaps.eosdis.nasa.gov/api/{mode}/{fmt}/{MAP_KEY}/{source}"
    if mode == "country":
        url = f"{base}/{country.upper()}/{day_range}/{start.isoformat()}"
    else:
        bbox = f"{west},{south},{east},{north}"
        url  = f"{base}/{bbox}/{day_range}/{start.isoformat()}"

    # 4) 请求 FIRMS
    try:
        # 对大国/多日查询可能返回几十万行，给更长读超时并加重试
        session = requests.Session()
        session.mount("https://", requests.adapters.HTTPAdapter(max_retries=3))
        resp = session.get(url, timeout=(10, 120))   # 10 秒连接，120 秒读
        resp.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(
            502,
            f"FIRMS 请求失败: {e}. "
            "若多次超时，可缩小时间跨度或改用坐标查询。"
        )

    # 5) 解析 CSV 并返回
    data = list(csv.DictReader(io.StringIO(resp.text)))
    return data 