# Update Log

This document records notable changes applied to the project by the agent.

## 2025-08-31

- Backend
  - Enforced environment variable usage: removed fallback hard-coded MAP key; if `FIRMS_MAP_KEY` is missing, API returns 503. Kept legacy `FIRMS_API_KEY` with deprecation warning.
  - Fixed country validation: stop calling deprecated `/api/countries` (returns "Invalid API call"). Now only ISO3 format is validated and country queries use v4 `country` endpoint directly.
  - Implemented ISO3闁愁偅濡糱ox mapping for common countries and route all country queries via `area` endpoint; unknown ISO3 returns 400 with guidance to use bbox.
  - Hardened routes: removed debug endpoints and test utilities to reduce attack surface.
  - Improved `format` query validation to `pattern` (FastAPI/pydantic v2 compatibility).
  - GeoJSON transformation now preserves `acq_date`, `acq_time`, `bright_ti4`, `bright_ti5`, and normalized `brightness`/`confidence` for better frontend compatibility.
  - Cleaned unused imports and streamlined HTTP client usage.

- Frontend
  - Added required Chart.js dependency; resolved TypeScript issues around optional and numeric fields.
  - Unified query parameter to `sourcePriority` and updated query key for caching.
  - Heatmap and Cluster now tolerate missing/typed fields (brightness, FRP, confidence).
  - Trend chart fetches full-range JSON once for accurate daily series.
  - Search form adds dataset selector (optional) and strict date validation (闁?0 days, end 闁?today).
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
  - Legend help: Added Help dialog (Legend/Filter/Timeline/Measure & Location) and a quick 闁?闁?entry in the Legend panel.
  - Toolbar: Implemented Measure (basic distance), Location (drop marker and copy lat/lon), and Help actions.
  - Fixed: Analytics 面板展开时，右侧 Legend 会遮挡下拉菜单的问题（提高 Select 菜单 z-index）。
- Docs
  - No setup changes. Next: reflect UI grouping in screenshots/guide.

- Validation
  - To run locally: `cd frontend && npx tsc -p tsconfig.json --noEmit` and `python -m py_compile backend/main.py`.

## 2025-07-02 (from previous README)
- Frontend: TypeScript fixes, error handling improvements.
- Backend: URL corrections for v4, debugging endpoints (now removed), validation improvements.

## 2025-09-02

- Frontend
  - Removed Location tool from the bottom toolbar and map logic; disabled-interaction states now depend only on Measure mode.
  - Updated cluster/marker interactionDisabled flags to ignore removed Location state.
  - LAYERS button now scrolls/focuses the right-side controls panel and briefly highlights it.
  - MUI Select menus use portal-to-body with zIndex 20000 to avoid overlap; applied on Heatmap weight and Filter selects.
  - Help dialog content updated (EN) and notes that Location has been removed.
  - Measure: upgraded with Distance/Area modes, unit switching (km/mi/m; km閾?mi閾?ha), per-segment labels, ESC cancel, Clear/Pan in a floating "MEASURE TOOL" card.
  - Legend: temporarily removed the right-panel Legend section to prevent dropdown overlap with Analytics (Trend/Radar) and MUI Selects.

- Docs
  - README UI overview: noted that the Location action has been removed.
  - todo list: added a checked item to mark 闁炽儲绮庝簺闂?Location闁挎稑鐗婄€垫粓鏌﹂鑽ょ憿濞寸媴绲块悥婊堟晬濞戞瑦鐎俊妤嬬到閸戯繝寮寸€涙ɑ鐓€闁挎稑顦埀?
  - TODOs updated: range-selection and tick-density items checked; LAYERS focus behavior marked complete.

- Validation
  - To run locally: `cd frontend && npx tsc -p tsconfig.json --noEmit` and `python -m py_compile backend/main.py`.
