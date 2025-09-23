# FIRMS Rebuild TODO (MoSCoW)

This list tracks the full-system rebuild toward Stage 1-5 delivery.

## Must
- [x] Stage 1: Framework scaffolding
  - AC: Vite + React + Zustand skeleton committed under frontend-vite/ with lint/test tooling
  - AC: FastAPI modular layout (app/api, app/services, app/clients, app/core, app/schemas) with CORS + GZip
  - AC: GitHub Actions workflow running lint + unit tests
- Stage 2: Data & API layer
  - [x] AC: FIRMS client with retries/cache + unified error model
  - AC: /fires & /fires/stats rewritten with typed responses and tests (mock FIRMS)
    - [x] Route tests for modular /api (`backend/tests/test_api_routes.py`)
    - [ ] Typed response models in `app/schemas` and response_model wiring
  - AC: Frontend query service (Axios + TanStack Query) covering retries/toasts
- Stage 3: Map core reimplementation
  - [x] AC: Hooks useMapInteractions, useMeasureTool, useAutoFit; Zustand store for map state
  - [x] AC: Measurement tool detach from map locking; automated tests in place (unit ready, e2e planned for Stage 5)
- Stage 4: Feature migration
  - AC: Time slider, filters, analytics, search form migrated to new architecture with URL sync
  - AC: Optional localisation scaffolding prepared
- Stage 5: Ops & acceptance
  - AC: Cypress e2e covering load/measure/filter/analytics/share flows
  - AC: Dockerfile + docker-compose + deployment guide + CHANGELOG

## Should
- Help copy rewrite (EN/ZH) once new UI is in place
- .env templates and configuration docs for all environments
- Data availability admin endpoints (TTL override, cache flush) + runbook
- Country fallback fit messaging for zero-result ISO3 queries

## Could
- Advanced measure: undo last point, multi-record save, export GeoJSON
- Additional basemaps or 3D mode (Cesium/Mapbox GL) once core stabilises
- Screenshot/export current view

## Progress Updates
- 2025-09-12: Rebuild plan approved; documentation updated (AGENTS/README/todo).
- 2025-09-23: Stage 1 scaffolds created (frontend-vite skeleton, backend/app modular layout).
- 2025-09-24: Stage 2 underway (FIRMS client/service modules scaffolded, CI+Prettier/Vitest baseline).
- 2025-09-25: Stage 2 moving into API replacement (new /api/fires + stats, pytest passing)
- 2025-09-25: Stage 3 map core scaffolding (Zustand store + React-Leaflet shell).
- 2025-09-26: Stage 3 measurement + query panel + heatmap/point/cluster styling & legends shipped (unit coverage; e2e planned)
- 2025-09-27: Stage 4 time slider + filter integration underway (unit coverage; Stage 4 ongoing)
- 2025-09-27: CI now runs backend pytest; fixed StatsPanel fallback to avoid requiring QueryClientProvider.
