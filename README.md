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

Note on API keys:
- FIRMS returns HTTP 200 with plain text like "Invalid MAP_KEY." for bad keys. The backend now detects this and responds 503 with a clear error. If you see empty results, verify your key.
- Obtain a valid FIRMS API Map Key from the FIRMS portal (Manage API keys). Replace `FIRMS_MAP_KEY` and restart the backend.

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
  - Settings do not persist across sessions (URL hash/localStorage disabled)
  - Fires section includes optional Filter (FRP/Brightness) applied to map layers
- Bottom: Time slider with quick ranges (Today / 24H / 48H / 7D / WEEK)
  - Shows month ticks and highlights the current date
  - Toolbar actions: Measure (distance/area) and Help
- Note: The Location action has been removed
- Note: Legend panel is temporarily removed to avoid dropdown overlap (Trend/Radar, Select poppers)

## Usage Guide

## Frontend Data Fetching Strategy

- Use TanStack Query to manage wildfire data requests
- Cache key: (mode, source, country|bbox, startDate, endDate, format)
- Fetch once for the selected date range; filter by acq_date locally via the time slider
- Use exponential backoff on failures; inspect cache with React Query Devtools

## Measure (Overview)
- Modes: Distance / Area
- Units: km / mi / m; km² / mi² / ha
- Interaction: click to add points; double-click to finish; ESC cancels; Clear removes all; Pan pauses drawing to pan the map
- Display:
  - Distance: per-segment labels (midpoints) and Total at the end
  - Area: when polygon has 3+ points, Area shown near center
- UI: a "MEASURE TOOL" card shows Mode, Units, Pan, Clear
Implementation: frontend/src/components/FireMap.tsx (MeasureLayerPro)

## Changelog

Latest changes are recorded in `UPDATE.md`.

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
- 429 Too Many Requests: FIRMS quota exceeded; wait or reduce request size
- CORS blocked: include frontend origin in `ALLOWED_ORIGINS`

## Development Docs

See `AGENTS.md` for engineering workflow and conventions.

## Contributing

Issues and PRs are welcome.

## License

MIT License













