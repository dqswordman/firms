# FIRMS Wildfire Explorer

> **Status**: Legacy codebase under full rebuild. This README tracks both the current production behaviour and the staged roadmap (Stage 1-5) that will deliver the new architecture.

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

## Backend Setup (legacy)
```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate    # Windows PowerShell: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env`:
```
FIRMS_MAP_KEY=your_map_key_here
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Run the API:
```bash
uvicorn main:app --reload
```

### Stage 1 scaffolding (in progress)

- New modular entrypoint: `backend/app/main.py` (FastAPI app factory with `/api` router placeholder).
- Configuration via `app/core/config.py` (`pydantic-settings`); ensure `pydantic-settings` installed from `requirements.txt`.
- Legacy `backend/main.py` remains active until Stage 2 migrates existing routes.
- `.env.example` contains placeholders for FIRMS credentials; copy to `backend/.env` before running.
- Stage 2 adds `frontend-vite/src/services` and `src/queries` for Axios + TanStack Query integration against the new `/api/fires` endpoints. Set `VITE_API_BASE_URL` in `frontend-vite/.env` as needed.

### Stage 3 (in progress)

- `frontend-vite/src/features/map/MapView.tsx` renders a React-Leaflet map backed by Zustand store state.
- `frontend-vite/src/stores/mapStore.ts` centralises viewport/baseLayer/query params for upcoming map features.
- `frontend-vite/src/index.css` defines the app shell layout; map output currently uses default OpenStreetMap tiles.

Endpoints:
- `GET /fires` - Returns GeoJSON (default) or JSON fire records. Query params include `country` or `west/south/east/north`, `start_date`, `end_date`, optional `sourcePriority`, `format` (`json|geojson`), and `maxConcurrency`.
- `GET /fires/stats` - Aggregated FRP buckets, day/night counts, confidence, and satellite distribution using the same query contract.
- `GET /health` - Liveness probe.

## Frontend Setup (legacy)
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:8000
```

Start the UI:
```bash
npm start
```
Visit http://localhost:3000 and search by ISO3 or bounding box. The legacy client still auto-fits once results arrive; Stage 3 will introduce a new auto-fit hook without the current snap-back issues.

## Validation & Tooling
- Legacy frontend: `cd frontend && npx tsc -p tsconfig.json --noEmit`
- Stage 1 frontend scaffold:
  - `cd frontend-vite && npm run lint`
  - `cd frontend-vite && npm run test`
  - `cd frontend-vite && npm run build`
  - `cd frontend-vite && npm run format` (check) / `npm run format:write`
- Backend:
  - Syntax check: `python -m py_compile backend/main.py`
  - Modular services: `cd backend && pytest`
- Upcoming: Stage 2 will introduce pytest suites for backend routes.

## Map & UI Notes
- **Layer panel**: Fires / Overlays / Backgrounds / Analytics are collapsible. LAYERS button scrolls and highlights the control card.
- **Filters**: FRP and Brightness sliders share metric ranges; enabling "Apply to Analytics" keeps Statistics/Trend/Radar aligned.
- **Auto viewport**: Every new query fits the map to returned features (or bbox fallback) before user adjustments.
- **Timeline**: dual slider keeps current-day highlight; quick range buttons recompute date ranges without re-querying.
- **Measurement**: Distance/Area with km/mi/m and km²/mi²/ha, per-segment labels, ESC cancel, Pan toggle, Clear reset.

## Backend Behaviour
- Data availability metadata is cached per MAP key + sensor for 600 seconds to avoid redundant FIRMS calls.
- Availability lookups now execute in a background thread (`asyncio.to_thread`) so request handlers remain responsive.
- Invalid MAP keys raise HTTP 503 with detailed guidance.
- CSV ingestion de-duplicates points using `(acq_date, acq_time, lat, lon, source)` key and normalises property names (brightness, confidence, FRP, etc.).

## Troubleshooting
- **Invalid MAP key**: `/fires` returns 503 with `Invalid ... MAP_KEY`. Regenerate the key and update `backend/.env`.
- **Empty response**: verify the requested dataset covers the date range (max 10 days) and the bbox is correct. The response will include `X-Data-Availability` when the dataset has no coverage.
- **CORS errors**: ensure the frontend origin is listed in `ALLOWED_ORIGINS`.
- **Frontend build issues**: clear node modules (`rm -rf node_modules && npm install`) and re-run TypeScript check.

## Change Log
See [`UPDATE.md`](UPDATE.md) for reverse-chronological agent summaries.

## License
MIT License
