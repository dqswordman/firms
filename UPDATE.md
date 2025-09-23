# Update Log

## 2025-09-27

- Backend
  - Enabled CORS and GZip middleware in the modular FastAPI app (`backend/app/main.py`) to match legacy behaviour while reading allowed origins from `ALLOWED_ORIGINS`.
  - Updated README validation instructions to include `python -m py_compile backend/app/main.py`.
  - Added pytest coverage for modular routes under `backend/tests/test_api_routes.py` (health, fires, stats) with FIRMS and availability mocked.
  - Added temporary legacy compatibility by mounting the fires router at root (`/fires`, `/fires/stats`) alongside `/api/*`.
  - Fixed `Settings` to resolve `backend/.env` via absolute path so `FIRMS_MAP_KEY` loads correctly regardless of working directory.
  - Full cutover to modular app: removed legacy `backend/main.py` and dropped compatibility routes; tests updated to target `app.main` and services only. Removed manual HTTP scripts.
- Docs
  - Marked Stage 1 as complete and clarified middleware in `README.md`. Updated backend/frontend setup to modular+Vite only.
  - Fixed typos/control characters in `todo list.md` and noted modular layout now includes CORS + GZip.
  - Updated README to note modular route tests inclusion.
  - Added Vite dev origins (5173) to example `ALLOWED_ORIGINS` and updated local `.env` to resolve CORS "Failed to fetch" during dev.

Validation
- Frontend legacy typecheck: `cd frontend && npx tsc -p tsconfig.json --noEmit` passed.
- Backend syntax check: `python -m py_compile backend/main.py` passed.
- Backend syntax check (modular): `python -m py_compile backend/app/main.py` passed.
- Backend tests: `cd backend && pytest -q` passed (26 tests).
- Backend tests: `cd backend && pytest -q` passed (30 tests).

Next
- Proceed with Stage 2/3 polishing: firm up `/api/fires` error shapes and add typed response schemas in `app/schemas`.

## 2025-09-26

- Frontend
  - Extended `frontend-vite/src/stores/mapStore.ts` to manage measurement state, interaction toggles, and queued auto-fit bounds with distance/area calculations.
  - Added dedicated map hooks (`useMapInteractions`, `useMeasureTool`, `useAutoFit`) under `frontend-vite/src/features/map/hooks/` and wired them into `MapView`.
  - Introduced map interaction styling cues in `frontend-vite/src/index.css` and refreshed unit tests (`src/__tests__/mapStore.test.ts`) for measurement flow and auto-fit requests.
  - Built measurement sidebar controls (`frontend-vite/src/features/map/MeasurementPanel.tsx`) and overlay rendering (`frontend-vite/src/features/map/MeasurementOverlay.tsx`) with shared formatting helpers and dedicated UI tests (`src/__tests__/MeasurementPanel.test.tsx`).
  - Routed live FIRMS data into the map via `frontend-vite/src/features/map/FiresLayer.tsx`, auto-fitting bounds with `fireUtils.ts` helpers and status messaging inside `MapView`.
  - Added layer toggles (`frontend-vite/src/features/map/LayerPanel.tsx`) with supercluster-backed clusters, heatmap legend support, and new utility tests/styling for the Stage 3 shell.
  - Introduced query submission (`frontend-vite/src/features/map/QueryPanel.tsx`) with validation helpers and vitest coverage, wiring results through Zustand to refresh TanStack Query data.
  - Added filter controls (`frontend-vite/src/features/map/FilterPanel.tsx`) and reusable helpers (`filterUtils.ts`) to apply FRP/confidence criteria before rendering layers.
  - Refined map styling: heatmap radius/colour ramps, cluster bubble palette, and added legends (`ClusterLegend.tsx`, CSS updates) to mirror legacy cues.
- Docs
  - Documented the new map hooks and measurement coverage in `README.md` and updated `todo list.md` Stage 3 status plus progress log.

This document records notable changes applied to the project by the agent.

## 2025-09-12

- Backend
  - Cached FIRMS data availability metadata with a 10 minute TTL and protected access via a threading lock.
  - Moved availability lookups off the event loop using `asyncio.to_thread`, passing resolved datasets into `_prepare_fire_query` to keep handlers non-blocking.
  - Stage 1 scaffolding: added `backend/app/` modular layout (`api`, `services`, `clients`, `core`, `schemas`) with placeholder app factory and health probe; updated requirements for `pydantic-settings` and provided `.env.example`.
  - Stage 2 progress: extracted FIRMS client/service modules with async dedupe & NDJSON streaming hooks, plus pytest coverage for query prep/fetch/stats.
- Frontend
  - Normalised FRP/Brightness sliders to share metric extraction logic; clamped thresholds when the available range shrinks.
  - Hardened `useFiresQuery` to accept numeric or string latitude/longitude values and ignore malformed points.
  - Auto-fit the map to new results (or bbox fallback) via `AutoViewport`, keyed to query signatures so manual zoom stays put while keeping a single `ScaleControl`.
  - Restored map interactions after measurement sessions by centralising the lock/unlock logic; pan toggles no longer leave the map frozen.
  - Swapped garbled Trend error toast for a clear English message.
  - Stage 1 kickoff: scaffolded `frontend-vite/` (Vite + React + Zustand + TanStack Query) with placeholder App/store, ESLint/Prettier/Vitest baseline.
  - Stage 2 progress: added Axios-based query service (`src/services/http.ts`, `src/services/fires.ts`) and TanStack Query hooks (`src/queries/fires.ts`), plus sample tests.
  - Stage 3 kickoff: created Zustand map store (`src/stores/mapStore.ts`), React-Leaflet map view, and responsive layout (`src/index.css`).
- Docs
  - Replaced `AGENTS.md` with rebuild playbook outlining staged roadmap and operating rules.
  - Updated `README.md` to document the staged rebuild plan alongside legacy setup instructions and new tooling commands (lint/test/build/format, pytest).
  - Reset `todo list.md` to stage-based MoSCoW tracking for the full refactor; logged Stage 2 progression.
- Housekeeping
  - Added `.github/workflows/ci.yml` to run Stage 1 lint/test/build checks and backend pytest.
  - Recorded new behaviour in `UPDATE.md` and maintained ASCII-only docs.

## 2025-08-31

- Backend
  - Enforced environment variable usage: removed fallback hard-coded MAP key; if `FIRMS_MAP_KEY` is missing, API returns 503. Kept legacy `FIRMS_API_KEY` with deprecation warning.
  - Fixed country validation: stop calling deprecated `/api/countries` (returns "Invalid API call"). Now only ISO3 format is validated and country queries use v4 `country` endpoint directly.
  - Implemented ISO3闂佹剚鍋呮俊绯眔x mapping for common countries and route all country queries via `area` endpoint; unknown ISO3 returns 400 with guidance to use bbox.
  - Hardened routes: removed debug endpoints and test utilities to reduce attack surface.
  - Improved `format` query validation to `pattern` (FastAPI/pydantic v2 compatibility).
  - GeoJSON transformation now preserves `acq_date`, `acq_time`, `bright_ti4`, `bright_ti5`, and normalized `brightness`/`confidence` for better frontend compatibility.
  - Cleaned unused imports and streamlined HTTP client usage.

- Frontend
  - Added required Chart.js dependency; resolved TypeScript issues around optional and numeric fields.
  - Unified query parameter to `sourcePriority` and updated query key for caching.
  - Heatmap and Cluster now tolerate missing/typed fields (brightness, FRP, confidence).
  - Trend chart fetches full-range JSON once for accurate daily series.
  - Search form adds dataset selector (optional) and strict date validation (闂?0 days, end 闂?today).
  - One-shot loading: queries now fetch the entire date range once; the time slider filters client-side to avoid per-day refetches.
  - UI overhaul with MUI: new dark app bar, floating MUI cards for query/controls, bottom analytics panel with tabs (Statistics/Trend/Radar).
  - Heatmap styling improved (radius/blur/gradient); basemap selector added (OSM, CARTO Dark, Esri Satellite, Stamen Toner).
  - Moved Analytics (Statistics/Trend/Radar) into the right control panel (second row) with tabs; ensures visibility and layout stability.
  - Added overlays section (Country Outline, Graticule, Street Ref) and scale/mouse coords.
  - Added URL hash state (mode/region/dates/layers/view), plus quick-range buttons on the timeline.

- Documentation
  - Rewrote API, Architecture, and Performance docs for clarity and correctness.
  - Updated README with precise .env setup for backend and frontend; added troubleshooting.

- Housekeeping
  - Created `backend/.env` with provided key and `ALLOWED_ORIGINS` for local dev.
  - Created `frontend/.env` pointing to backend at `http://localhost:8000`.
  - Removed unused files: local build outputs, venv, debug HTML/scripts, extra CSS and type stubs, root-level Node manifests.

## 2025-09-01

- Frontend
  - Right-side layers panel grouped into collapsible sections (Fires / Overlays / Backgrounds / Analytics) using MUI Accordion; state persists via URL hash.
  - Time slider enhanced with month ticks and current-date highlight while keeping one-shot range loading.
  - Added localStorage fallback to restore last query, layer settings, and viewport when URL hash is absent.
  - Fixed: Time slider no longer disappears when current day has 0 points; it remains visible for the selected range.
  - Fixed: Trend chart jitter by avoiding destroy/recreate on each update and disabling animations; chart now updates data smoothly and remains visible even when the current day has no points.
  - Heatmap: Added viridis-like gradient and dynamic radius/blur by zoom for clearer multi-scale visualization.
  - Clusters: Redesigned cluster icons with adaptive size/color based on counts, smaller cluster radius for less over-aggregation, and FRP-based single-point marker sizing with subtle stroke.
  - Time slider: Added range selection (dual handles) and integrated with Trend to focus the displayed interval.
  - Time slider: Adaptive tick density and labeling for long ranges; keeps current-day highlight.
  - Clusters: Hover tooltip now shows Count and Avg FRP via Supercluster aggregation.
  - Popups: Refreshed card-like HTML for single points with clearer fields and formatting.
  - Map filtering: Added optional Filter (FRP/Brightness >= threshold) in Fires panel; applies to heatmap and clusters; disabling shows all points again.
  - Filter persistence: Filter settings persist via URL hash and localStorage as part of layer settings.
  - Analytics integration: Optional toggle to apply the same filter to Analytics (Statistics/Trend/Radar).
  - Legend help: Added Help dialog (Legend/Filter/Timeline/Measure & Location) and a quick 闂?闂?entry in the Legend panel.
  - Toolbar: Implemented Measure (basic distance), Location (drop marker and copy lat/lon), and Help actions.
  - Fixed: Analytics 闈㈡澘灞曞紑鏃讹紝鍙充晶 Legend 浼氶伄鎸′笅鎷夎彍鍗曠殑闂锛堟彁楂?Select 鑿滃崟 z-index锛夈€?- Docs
  - No setup changes. Next: reflect UI grouping in screenshots/guide.

- Validation
  - To run locally: `cd frontend && npx tsc -p tsconfig.json --noEmit` and `python -m py_compile backend/main.py`.

## 2025-09-02

- Frontend
  - Removed Location tool from the bottom toolbar and map logic; disabled-interaction states now depend only on Measure mode.
  - Updated cluster/marker interactionDisabled flags to ignore removed Location state.
  - LAYERS button now scrolls/focuses the right-side controls panel and briefly highlights it.
  - MUI Select menus use portal-to-body with zIndex 20000 to avoid overlap; applied on Heatmap weight and Filter selects.
  - Help dialog content updated (EN) and notes that Location has been removed.
  - Measure: upgraded with Distance/Area modes, unit switching (km/mi/m; km闁?mi闁?ha), per-segment labels, ESC cancel, Clear/Pan in a floating "MEASURE TOOL" card.
  - Legend: temporarily removed the right-panel Legend section to prevent dropdown overlap with Analytics (Trend/Radar) and MUI Selects.

- Docs
  - README UI overview: noted that the Location action has been removed.
  - todo list: added a checked item to mark 闂佺偨鍎茬划搴濈昂闂?Location闂佹寧绋戦悧濠勨偓鍨矒閺岋箓顢欓懡銈囨喛婵炲濯寸徊鍧楁偉濠婂牊鏅繛鎴炵懄閻庮喗淇婂Δ瀣埌闁告埊绻濆瀵糕偓娑櫳戦悡鈧梺鎸庣☉椤︻偊鍩€?
  - TODOs updated: range-selection and tick-density items checked; LAYERS focus behavior marked complete.

- Validation
  - To run locally: `cd frontend && npx tsc -p tsconfig.json --noEmit` and `python -m py_compile backend/main.py`.

2025-09-05 - Fix measure UI rendering issues
- frontend: FireMap.tsx add MouseCoordsFixed with proper degree symbol; use km/mi squared via Unicode escapes in tooltips.
- frontend: Kept old MouseCoords in file but not used; prevents encoding issues.
- docs: No setup changes.

- frontend: MeasureLayerPro renders in a dedicated high-zIndex pane to keep points/lines visible above heatmap/clusters.

- frontend: Persist in-progress measure geometry in a dedicated saved layer to avoid transient clears; finalize simply ends the session without redrawing.

- frontend: Fix CLEAR to remove both preview and saved measurement layers; add clearToken effect.

- frontend: Reworked MeasureLayerPro live vs saved rendering; preview line shows full path total; double-click persists result and clears live; CLEAR wipes both groups reliably.

2025-09-05 - Measure stabilized; docs synced
- Frontend
  - Fixed render loop causing components to remount on mousemove (guarded settings propagation), eliminating 鈥淢aximum update depth exceeded鈥?
  - Finalized Measure UX: first click shows dashed preview + running total; subsequent clicks fix segments with per-segment labels; double-click ends session; CLEAR reliably removes all items.
  - Ensured all measure vectors use a dedicated pane + SVG renderer for stable z-order above heatmap/clusters.
- Docs
  - README: Updated Measure usage and UI overview to reflect live preview, double-click to finish, and robust CLEAR.
  - TODOs: Marked measure stabilization complete; follow-ups left for Undo and multi-record export.


## 2025-09-11

- Frontend
  - Fixed crash on initial load: guarded feature filtering in `frontend/src/App.tsx:useMemo` to tolerate undefined collections.
  - Disabled session restore per request: removed reading/writing of URL hash and localStorage. New sessions start clean without showing the last query.
  - Stopped persisting layer settings and viewport in `App.tsx` callbacks.
  - Hardened `FireMap` to guard `.features.map` when building point arrays.
  - Validated fetch shape in `useFiresQuery`: if backend returns `[]` while `format=geojson`, coerce to an empty FeatureCollection to avoid runtime errors.

- Docs
  - Updated `todo list.md` Must AC to note persistence disabled; added a completed item for disabling session restore.

- Validation
  - Ran `cd frontend && npx tsc -p tsconfig.json --noEmit` successfully.
  - Ensured backend returns a consistent type for early returns.

- Backend
  - `GET /fires`: when query cannot be prepared (no data availability or invalid inputs), now returns an empty GeoJSON FeatureCollection if `format=geojson`, aligning response shape with frontend expectations.
  - Detect invalid MAP keys: `data_availability` and data fetch now check for FIRMS plain-text errors (e.g., "Invalid MAP_KEY.") and return 503 with guidance instead of silently returning empty results.

## 2025-09-27

- Frontend
  - Fixed StatsPanel to skip creating a TanStack Query when no query is present, allowing fallback rendering without a QueryClientProvider (`frontend-vite/src/features/map/StatsPanel.tsx`).
- CI
  - Enabled backend pytest in CI (`.github/workflows/ci.yml`) to run unit tests after syntax check.
- Docs
  - Clarified backend run commands for legacy vs modular app in `README.md`.
