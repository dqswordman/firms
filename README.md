# FIRMS Wildfire Explorer

Status: Modular FastAPI backend + Vite React frontend (frontend-vite) are the single source of truth. The legacy `frontend/` app has been removed.

The application delivers a NASA FIRMS inspired wildfire intelligence workspace with single-range data fetching, map visualisation, analytics (Statistics / Trend / Radar), measurement tools, filtering, and shareable views.

## Rebuild Roadmap

| Stage | Scope | Key Deliverables |
|-------|-------|------------------|
| 1 | Framework | Vite + React + Zustand skeleton, FastAPI modular layout, CI (lint+test), baseline tests |
| 2 | Data & APIs | Rewritten `/fires` & `/fires/stats`, FIRMS client with caching/retries, unified query service |
| 3 | Map Core | Hooks for map/measure/auto-fit, Zustand-driven state, removal of legacy side-effects |
| 4 | Feature Migration | Time slider, filters, analytics, search, URL sync, optional i18n |
| 5 | Ops & Acceptance | E2E tests, Docker/Nginx, deployment scripts, final documentation & changelog |

Each stage ships a running build, updated documentation, and automated tests. See `UPDATE.md` for reverse-chronological milestones.

## Architecture Overview

- Frontend (only supported UI): Vite + React 18 + TypeScript, react-leaflet, Zustand, TanStack Query, Chart.js.
- Backend: FastAPI, httpx; proxies FIRMS Area CSV endpoints, validates ISO3/bbox, caches dataset availability, and outputs normalised GeoJSON.

### Data Flow
1. Frontend issues a single `/api/fires` request for the selected range (country or bbox).
2. Backend validates and resolves the best dataset using cached availability, fetches matching CSV segments concurrently, and de-duplicates rows.
3. Response returns GeoJSON (default) or JSON; frontend filters per day/time slider and renders map + analytics.

## Backend Setup

Prerequisites: Node.js 18+, npm 9+, Python 3.11+, FIRMS MAP key with Area CSV permissions

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate    # Windows PowerShell: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env`:

```
FIRMS_MAP_KEY=your_map_key_here
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MAX_CONCURRENT_REQUESTS=5
```

Run the API:

```bash
cd backend
uvicorn app.main:app --reload
```

Endpoints (modular):
- GET `/api/fires` → GeoJSON (default) or JSON; params: country (mapped to bbox) or west/south/east/north, start_date, end_date, optional sourcePriority, format=(json|geojson), maxConcurrency.
- GET `/api/fires/stats` → FRP buckets, day/night, confidence, satellite distribution.
- GET `/api/health` → liveness probe.

## Frontend Setup (Vite)

```bash
cd frontend-vite
npm install
npm run dev
```

Optional: `frontend-vite/.env`

```
VITE_API_BASE_URL=http://localhost:8000/api
```

Visit http://localhost:5173

## Validation & Tooling

- Frontend (Vite):
  - `cd frontend-vite && npx tsc -p tsconfig.json --noEmit`
  - `cd frontend-vite && npm run lint`
  - `cd frontend-vite && npm run test`
  - `cd frontend-vite && npm run build`
- Backend:
  - Syntax check: `python -m py_compile backend/app/main.py`
  - Unit tests: `cd backend && pytest`

## Map & UI Notes

- Dashboard-first: default view is a Dashboard (Root). Open the Map module when needed.
- Filters: FRP, Confidence, Date; time window acts as a client-side date filter (no refetch). Confidence normalization supports numeric (>=80 high, >=30 nominal) and textual (h/n/l).
- Auto-fit: Every new query fits the map to returned features (or bbox fallback) before user adjustments.
- Points & Popups: click any fire point to see details (date/time, FRP, confidence, satellite, source). Heatmap never blocks clicks.
- Charts: Daily counts (line) and Radar (VIIRS/Terra/Aqua) reflect current filters. Radar uses the latest available date in the loaded set to avoid timezone/data-availability gaps.
- Measurement: Distance/Area with km/mi/m and km²/mi²/ha, per-segment labels, ESC cancel, Pan toggle, Clear reset.

## Backend Behaviour

- Availability metadata cached per MAP key + sensor (TTL 600s) to avoid redundant FIRMS calls.
- Availability lookups off the event loop (`asyncio.to_thread`) keep handlers responsive.
- Invalid MAP keys raise HTTP 503 with guidance.
- CSV ingestion de-duplicates rows by `(acq_date, acq_time, lat, lon, source)` and normalises property names (brightness, confidence, FRP, etc.).

## Troubleshooting

- Invalid MAP key: `/api/fires` returns 503 with `Invalid ... MAP_KEY`.
- 400 on dates: ensure `end_date` is not in the future and range ≤ 10 days.
- Empty response: verify dataset coverage (max 10 days) and correct bbox; `X-Data-Availability` header included when no coverage.
- CORS errors: ensure the frontend origin is listed in `ALLOWED_ORIGINS`.

## Change Log

See `UPDATE.md` for reverse-chronological agent summaries.

## License

MIT License

