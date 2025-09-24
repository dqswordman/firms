# FIRMS Wildfire Explorer

> **Status**: New modular architecture is the default. This README documents the current behaviour and staged roadmap (Stage 1-5).

The application delivers a NASA FIRMS inspired wildfire intelligence workspace with single-range data fetching, map visualisation, analytics, and sharing. During the rebuild we will retain all user-facing features while progressively migrating to a modern, modular stack.

## Rebuild Roadmap

| Stage | Scope | Key Deliverables |
|-------|-------|------------------|
| 1 | Framework | Vite + React + Zustand skeleton, FastAPI modular layout, CI (lint+test), baseline tests |
| 2 | Data & APIs | Rewritten `/fires` & `/fires/stats`, FIRMS client with caching/retries, unified query service |
| 3 | Map Core | Hooks for map/measure/auto-fit, Zustand-driven state, removal of legacy side-effects |
| 4 | Feature Migration | Time slider, filters, analytics, search, URL sync, optional i18n |
| 5 | Ops & Acceptance | E2E tests, Docker/Nginx, deployment scripts, final documentation & changelog |

Each stage must ship a running build, updated documentation, and automated tests. `UPDATE.md` records stage milestones chronologically.

## Feature Highlights (legacy baseline)
- **NASA-style map shell** with auto-fit viewport, grouped layer controls, and dark glass UI treatment.
- **One-shot range loading**: the backend proxy de-duplicates FIRMS CSV data while the frontend filters by day on the client.
- **Layer groups & analytics**: heatmap, clusters, overlays, basemap selector, plus Statistics / Trend / Radar analysis tabs.
- **Range-aware time slider** with Today/24H/48H/7D/WEEK shortcuts, dual-handle range selection, and adaptive tick density.
- **Measurement suite** supporting distance and area, multiple unit systems, pan mode, and Clear/ESC guards.
- **Robust filtering**: FRP/Brightness thresholds now share the same scale across heatmap, clusters, and analytics.

## Architecture Overview

> This section describes the legacy stack currently in production. Stage 1 will introduce a Vite + React + Zustand frontend and a modular FastAPI backend layout; the table will be updated alongside that change.

| Layer    | Stack & Responsibilities |
|---------|--------------------------|
| Frontend | React 18, TypeScript, react-leaflet, Tailwind, MUI. Handles UI state, client-side filtering, timelines, analytics, and measurement tooling. |
| Backend  | FastAPI, httpx, requests, python-dotenv. Proxies FIRMS area CSV endpoints, validates ISO3/bbox, caches dataset availability, and normalises GeoJSON output. |

### Data Flow
1. The frontend issues a single `/fires` request for the selected range (country or bbox).
2. The backend validates the request, resolves the best dataset via cached data availability metadata (10 minute TTL), fetches matching CSV segments concurrently, and de-duplicates rows.
3. Responses return either GeoJSON or JSON; the frontend hydrates the FeatureCollection and filters per day/time slider.
4. Trend analytics request JSON form of the same range to avoid re-fetching per interaction when cached data is unavailable.

## Prerequisites
- Node.js 18+
- npm 9+
- Python 3.11+
- FIRMS MAP key with area CSV permissions

## Backend Setup
```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate    # Windows PowerShell: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env`:
```
FIRMS_MAP_KEY=your_map_key_here
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000
MAX_CONCURRENT_REQUESTS=5
```

Run the API:
```bash
cd backend
uvicorn app.main:app --reload
```

- Endpoints (modular):
- GET /api/fires ¡ª GeoJSON (default) or JSON; params: country (mapped to bbox) or west/south/east/north, start_date, end_date, optional sourcePriority, ormat (json|geojson), maxConcurrency.\n- GET /api/fires/stats ¡ª FRP buckets, day/night, confidence, satellite distribution.\n- GET /api/health ¡ª liveness probe.
### Stage 1 â€?Framework (complete)

- New modular entrypoint: `backend/app/main.py` (FastAPI app factory with `/api` router and production middlewares).
- Configuration via `app/core/config.py` (`pydantic-settings`); ensure `pydantic-settings` installed from `requirements.txt`.
- Legacy `backend/main.py` has been removed; use `app.main:app` exclusively.
- `.env.example` contains placeholders for FIRMS credentials; copy to `backend/.env` before running.
- Stage 2 adds `frontend-vite/src/services` and `src/queries` for Axios + TanStack Query integration against the new `/api/fires` endpoints. Set `VITE_API_BASE_URL` in `frontend-vite/.env` as needed.
 - CORS and GZip middleware are enabled for the modular app using `ALLOWED_ORIGINS` and a 1KB compression threshold to match legacy behaviour.

### Stage 3 (in progress)

- `frontend-vite/src/features/map/MapView.tsx` renders a React-Leaflet map backed by Zustand store state.
- `frontend-vite/src/stores/mapStore.ts` centralises viewport/baseLayer/query params for upcoming map features.
- `frontend-vite/src/index.css` defines the app shell layout; map output currently uses default OpenStreetMap tiles.
- `frontend-vite/src/features/map/hooks/` now provides `useMapInteractions`, `useAutoFit`, and `useMeasureTool` to coordinate map behaviour without lingering locks after measurement.
- Map measurement state (points, length, area) is stored via `src/stores/mapStore.ts` with unit tests in `src/__tests__/mapStore.test.ts` covering interaction toggles and auto-fit requests.
- `frontend-vite/src/features/map/MeasurementPanel.tsx` surfaces measurement controls and formatting helpers while keeping map toggles in sync.
- `frontend-vite/src/features/map/MeasurementOverlay.tsx` draws live polylines/polygons with summary tooltips for completed measurements.
- `frontend-vite/src/features/map/TimeSlider.tsx` adjusts the active date span (<=10 days) while keeping queries in sync.
- `frontend-vite/src/features/map/QueryPanel.tsx` collects country/bbox + date filters, validates input, and triggers TanStack Query submissions.
- `frontend-vite/src/features/map/FilterPanel.tsx` manages FRP range and confidence filters applied client-side before rendering.
- `frontend-vite/src/features/map/LayerPanel.tsx` manages point/cluster/heatmap toggles linked to Zustand state, with `HeatmapLegend.tsx` and `ClusterLegend.tsx` documenting intensity bins.
- `frontend-vite/src/features/map/FiresLayer.tsx` provides point, cluster (supercluster-backed), and heatmap renderers, reusing FIRMS metadata via helpers in `fireUtils.ts`.

## Frontend Setup (Vite)
```bash
cd frontend-vite
npm install   # includes react-chartjs-2 + chart.js used by Charts panel
npm run dev
```
Optional: `frontend-vite/.env`
```
VITE_API_BASE_URL=http://localhost:8000/api
```
Visit http://localhost:5173

## Validation & Tooling
- Frontend (Vite):
  - `cd frontend-vite && npm run lint`
  - `cd frontend-vite && npm run test`
  - `cd frontend-vite && npm run build`
  - `cd frontend-vite && npm run format` (check) / `npm run format:write`
- Backend:
  - Syntax check: `python -m py_compile backend/app/main.py`
  - Modular services: `cd backend && pytest`
- Stage 2 adds pytest suites for the modular backend routes (now included under `backend/tests/test_api_routes.py`).

### Debugging FIRMS key / availability
- Check availability quickly: `http://localhost:8000/api/debug/availability` (optional `?sensor=ALL|VIIRS_SNPP_NRT|...`).
- If this returns 503 or empty mapping, verify your `FIRMS_MAP_KEY`.
- Inspect composed upstream URLs (key masked) for any query:
  - `http://localhost:8000/api/fires/debug/compose?country=USA&start_date=2025-09-20&end_date=2025-09-23`
  - Note: We always call FIRMS v4 "area" endpoint under the hood (country endpoint is currently unavailable per FIRMS site). USA is mapped to a large bbox; consider smaller bbox for faster results.

## Map & UI Notes
- **Dashboard-first**: default view is a Dashboard (Root). Map is an entry you open when needed; close to return.
- **Filters**: FRP, Confidence and Date filters; Time window drives a client-side date filter (no refetch). Confidence normalization: numeric >=80->high, >=30->nominal, else low; h/n/l textual forms supported.
- **Auto viewport**: Every new query fits the map to returned features (or bbox fallback) before user adjustments.
- **Time window**: slider adjusts active date span (<= 10 days) without re-querying; presets (24h/48h/7d/custom) use the region¡¯s approximate timezone.
- **Points**: click any fire point to see a detail popup (date/time, FRP, confidence, satellite, source).
- **Charts**: Daily counts (line) and a Radar chart (today: VIIRS/Terra/Aqua) with toggles; both reflect current Filters.
- **Map badge**: when data is present, a Loaded N features badge appears on the map for quick feedback.
- **Measurement**: Distance/Area with km/mi/m and km^2/mi^2/ha, per-segment labels, ESC cancel, Pan toggle, Clear reset.

## Backend Behaviour
- Data availability metadata is cached per MAP key + sensor for 600 seconds to avoid redundant FIRMS calls.
- Availability lookups now execute in a background thread (`asyncio.to_thread`) so request handlers remain responsive.
- Invalid MAP keys raise HTTP 503 with detailed guidance.
- CSV ingestion de-duplicates points using `(acq_date, acq_time, lat, lon, source)` key and normalises property names (brightness, confidence, FRP, etc.).

## Troubleshooting
- **Invalid MAP key**: `/api/fires` returns 503 with `Invalid ... MAP_KEY`. Regenerate the key and update `backend/.env`.
- **400 Bad Request on dates**: Ensure `end_date` is not in the future and the range is â‰?10 days. The UI now prevents future dates.
- **Empty response**: verify the requested dataset covers the date range (max 10 days) and the bbox is correct. The response will include `X-Data-Availability` when the dataset has no coverage.
- **CORS errors**: ensure the frontend origin is listed in `ALLOWED_ORIGINS`.
- **Frontend build issues**: clear node modules (`rm -rf node_modules && npm install`) and re-run TypeScript check.

## Change Log
See [`UPDATE.md`](UPDATE.md) for reverse-chronological agent summaries.

## License
MIT License


