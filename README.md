# FIRMS Wildfire Data Visualization System

A global wildfire data visualization system based on NASA FIRMS API, supporting country/bbox queries and time series visualization.

## Features

- Global wildfire visualization with an interactive map
- Country or bbox-based queries with strict date validation (<= 10 days, end <= today)
- One-shot range fetch; client-side day filtering via time slider
- Multiple visualization layers:
  - Heatmap
  - Clusters
  - Overlays: Country Outline, Graticule, Street Ref
  - Analytics: Statistics / Trend / Radar
- Responsive UI with MUI and Tailwind CSS

## Quick Start

### Start Backend
1) `cd backend`
2) Create and activate venv
   - Windows: `python -m venv venv && .\venv\Scripts\activate`
   - macOS/Linux: `python -m venv venv && source venv/bin/activate`
3) Install deps: `pip install -r requirements.txt`
4) Create `backend/.env`
```
FIRMS_MAP_KEY=your_map_key_here
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```
5) Run: `uvicorn main:app --reload`

The backend uses NASA FIRMS v4 endpoints and supports `sourcePriority` to control dataset selection.

### Start Frontend
1) `cd frontend`
2) `npm install`
3) Create `frontend/.env`
```
REACT_APP_API_URL=http://localhost:8000
```
4) `npm start` and open http://localhost:3000

## UI Overview (NASA style)

- Top bar: dark translucent header with current date
- Left panel: Query card (Country/BBox, Date Range, Dataset, Format)
- Right panel: grouped sections (Fires / Overlays / Backgrounds / Analytics)
  - Analytics tabs: Statistics / Trend / Radar
  - Settings persist in URL hash; when absent, restore from localStorage
  - Fires section includes optional Filter (FRP/Brightness) applied to map layers
- Bottom: Time slider with quick ranges (Today / 24H / 48H / 7D / WEEK)
  - Shows month ticks and highlights the current date
  - Toolbar actions: Measure（距离/面积测量：点击加点，双击结束；支持单位切换 / 清空 / Pan 暂停）、Help（打开帮助对话框）
  - Note: The Location action has been removed
- Note: Legend panel is temporarily removed to avoid dropdown overlap (Trend/Radar, Select poppers)

## Usage Guide

1) Query
   - Country: ISO3 (e.g., CHN)
   - BBox: lat/lon min/max
2) Time selection
   - Use time slider to pick the day; quick-range buttons adjust range
3) Visualization controls
   - Heatmap, Clusters, Overlays toggles; Analytics tabs in the right panel
4) Map interactions
   - Pan/zoom the map; click clusters or points for details

## 前端数据获取策略

- 使用 TanStack Query 统一管理火点数据请求
- 以 `(mode, source, country|bbox, startDate, endDate, format)` 作为缓存键
- 在选定日期区间内仅请求一次；时间滑块切换按 `acq_date` 本地过滤
- 失败采用指数退避策略并弹出提示；可用 React Query Devtools 观察缓存命中

## Measure 功能说明（对齐 NASA 体验）

- 模式：Distance / Area
- 单位：距离 km / mi / m；面积 km² / mi² / ha（可切换）
- 交互：点击加点，双击结束；ESC 取消当前绘制；Clear 清空；Pan 暂停绘制以便拖动地图
- 显示：
  - 距离：分段里程标注（每段中点），末端显示 Total
  - 面积：闭合多边形后在中心显示 Area（未闭合不计算）
- UI：开启后左下显示“MEASURE TOOL”卡片（模式、单位、Pan、Clear）

实现位置：`frontend/src/components/FireMap.tsx`（MeasureLayerPro）

## Changelog

Latest changes are recorded in `UPDATE.md`.

### July 2, 2025
- Frontend: fixed TypeScript optional fields handling; improved error handling in charts
- Backend: align area queries with FIRMS v4; improved validation; debugging endpoints removed later

## Technology Stack

### Frontend
- React 18, TypeScript
- Leaflet + react-leaflet + leaflet.markercluster
- Chart.js + react-chartjs-2
- Tailwind CSS, date-fns, MUI

### Backend
- FastAPI, uvicorn
- requests, python-dotenv

## Troubleshooting

- 503 Service Unavailable: ensure `FIRMS_MAP_KEY` exists and restart backend
- 400 Bad Request: check ISO3/bbox; date span <= 10 days; end date <= today
- 429 Too Many Requests: FIRMS quota exceeded — wait or reduce request size
- CORS blocked: include frontend origin in `ALLOWED_ORIGINS`

## Development Docs

See `AGENTS.md` for engineering workflow and conventions.

## Contributing

Issues and PRs are welcome.

## License

MIT License

