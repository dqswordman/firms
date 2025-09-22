# Rebuild Playbook - FIRMS Wildfire Explorer

This document captures the operating rules for the ongoing full rebuild. Follow it strictly so every stage hand-off remains traceable and verifiable.

## 0. Goals
- Preserve the complete NASA FIRMS feature set: single-range data fetch, map visuals, measurement, filtering, analytics panels, time slider, sharing, etc.
- Refactor into a stable, modular, testable, continuously deliverable architecture.
- Execute a staged strategy (Stage 1-5). Each stage must deliver a running build with tests and docs updated.

## 1. Workflow
1. **Always plan**: use update_plan to break work into small steps; only one step may be in_progress.
2. **Minimal diff**: touch only files required for the task; use pply_patch for edits.
3. **Validation**:
   - Frontend: cd frontend && npx tsc -p tsconfig.json --noEmit
   - Backend: python -m py_compile backend/main.py
   - When new build tooling lands, mirror the updated commands in README.
4. **Documentation**: any meaningful change must update UPDATE.md, 	odo list.md, and README.md.
5. **Delivery notes**: summaries must list changes with file references, validation status, and next steps.

## 2. Stage Breakdown
- **Stage 1 每 Framework**: Vite + React + Zustand + TanStack Query skeleton; FastAPI module layout; CI pipeline; baseline tests.
- **Stage 2 每 Data & APIs**: rewrite /fires & /fires/stats, shared client, caching, error handling; frontend query service layer.
- **Stage 3 每 Map Core**: map container hooks, measurement tool, auto-fit, layers, Zustand-driven state; remove legacy side-effects.
- **Stage 4 每 Feature Migration**: time slider, filters, analytics, search form, URL sync, optional i18n.
- **Stage 5 每 Ops & Acceptance**: end-to-end tests, Docker/Nginx, deployment scripts, final docs & changelog.

> Before leaving a stage: ensure new code has tests, docs & TODO updated, add a UPDATE.md entry, and obtain user approval.

## 3. Collaboration Rules
- **Single source of truth**: rely on UPDATE.md, 	odo list.md, and README.md for status.
- **Dirty worktree**: never overwrite user changes you did not author; stop and ask if unsure.
- **Style**: ASCII-only; concise comments; avoid ny unless justified.
- **Configuration**: document new dependencies/env vars in README and .env.example (to be added Stage 1).

## 4. Stage Specific Notes
- *Stage 1*: scaffold new frontend folder, keep legacy code isolated until migrated; split backend into pp/api, pp/services, pp/clients, pp/core, pp/schemas; set up GitHub Actions (lint+test).
- *Stage 2*: implement FIRMS client with retries/cache; expose consistent error objects; create Axios + query service for frontend.
- *Stage 3*: design hooks such as useMapInteractions, useMeasureTool, useAutoFit; maintain map state via Zustand; measurement must not lock map after exit.
- *Stage 4*: migrate analytics components, search form validation, URL/state sync, optional localisation.
- *Stage 5*: cover E2E scenarios (load, measure, filter, analytics, share); ship Docker & deployment docs.

## 5. Quality & Release
- Run lint/test for each change; if skipped, explain why and how to resolve.
- Log every stage milestone in UPDATE.md with stage identifier.
- Breakers must be entered into TODO Must section with remediation plan.

## 6. Communication
- Raise blockers immediately.
- Do not advance stages without user sign-off. Evaluate new requests against the roadmap and update TODO accordingly.

Refactoring is a marathon: make each step reversible, testable, and easy for the next contributor to continue.
