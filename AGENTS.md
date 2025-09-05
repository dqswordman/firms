# Agent Operating Guide (Codex CLI)

This document describes how our agent (Codex CLI) collaborates in this repo. It encodes the habits we agreed in the project so future sessions can “plug in and go”.

## Workflow Principles

- Single Source of Truth for progress and changes:
  - UPDATE.md: Every meaningful change must append a concise entry (what/why/where).
  - todo list.md: Any request that cannot be completed in one pass is broken into actionable TODOs and kept up to date (check off when completed).
  - README.md: If UX, setup, endpoints, or run-instructions change, README must be updated in the same PR/change set.
- Planning: Use the plan tool (update_plan) for multi-step tasks; keep exactly one in-progress step.
- Surgical edits: Use apply_patch; avoid unrelated churn.
- Validation first: Prefer running TypeScript compile (`npx tsc --noEmit`) and basic Python syntax checks (`python -m py_compile`) after changes.
- One-shot data loading philosophy on frontend: fetch once per date range; filter client-side for day-by-day interactions.
- Backend calls FIRMS v4 area endpoints; country is mapped to a bbox; keep ISO3 validation lightweight.

## Daily Flow (Checklist)

1) Understand request and scope. If multi-step, call update_plan with steps.
2) Implement changes with apply_patch.
3) Validate locally:
   - Frontend: `cd frontend && npx tsc -p tsconfig.json --noEmit`
   - Backend: `python -m py_compile backend/main.py`
4) Documentation discipline:
   - Append UPDATE.md with a dated entry (bullets: backend, frontend, docs, housekeeping).
   - Update todo list.md for outstanding items (Must/Should/Could classification when relevant).
   - Update README.md if setup, UI layout, routes, env, or usage changed.
5) Summarize to user with what changed, where, and next steps.

## File Conventions

- UPDATE.md: Reverse-chronological updates. Include impacted files when helpful.
- todo list.md: Must / Should / Could sections with AC (Acceptance Criteria) and a mini task list. Mark completed/ongoing.
- backend/.env: Contains `FIRMS_MAP_KEY` (MAP key) and `ALLOWED_ORIGINS` for local dev.
- frontend/.env: Contains `REACT_APP_API_URL` for API base.

## Frontend Architecture (current)

- One-shot range fetch via `useFiresQuery`; time slider filters by `acq_date` locally.
- Right panel contains:
  - Visualization: Heatmap/Clusters, weight and threshold.
  - Overlays: Country Outline, Graticule, Street Ref.
  - Basemap: OSM, CARTO Dark, Esri Satellite, Stamen Toner, OpenTopoMap, BlueMarble (if CORS allows).
  - Analytics (second row): Statistics / Trend / Radar tabs.
- URL Hash encodes mode/region/dates/current/layers/viewport to support share/restore.

## Backend Architecture (current)

- FastAPI with FIRMS v4 area CSV endpoints.
- Country→BBOX mapping for common ISO3 (e.g., USA, CHN, THA …); otherwise encourage bbox.
- Data availability checked against `/api/data_availability/csv/{MAP_KEY}/ALL` before constructing URLs.

## Coding Standards

- TypeScript strictness: add minimal types; guard optional fields and number parsing.
- Python: prefer Pydantic v2 style models for parameter schemas; centralized HTTP errors with HTTPExceptionFactory.
- Avoid logging secrets; keep MAP key in .env.

# FIRMS Wildfire Data Visualization System

## System Architecture

### Frontend (React + TypeScript)
- Built with React 18 and TypeScript
- Map visualization using Leaflet and react-leaflet
- Clustering with Leaflet.markercluster
- Data visualization with Chart.js and react-chartjs-2
- Responsive design with Tailwind CSS
- Date handling with date-fns

### Backend (FastAPI + Python)
- RESTful API built with FastAPI
- NASA FIRMS API integration using requests library
- Environment variable management with python-dotenv

## Component Structure

### Frontend Components
1. Map Components:
   - `FireMap`: Main map container and visualization controls
   - `FireHeatmap`: Heatmap layer (always visible)
   - `FireCluster`: Clustering layer (always visible)
   - `SearchForm`: Country/region search interface
   - `TimeSlider`: Date selection and navigation

2. Visualization Components:
   - `FireStatsPanel`: Statistical analysis (toggleable)
   - `FireTrendChart`: Time series trends (toggleable)
   - `FireRadarChart`: FRP and day/night distribution (toggleable)

3. Utility Components:
   - `SearchForm`: Query interface
   - `TimeSlider`: Date navigation

## Development Environment Setup

### Frontend Setup
1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

Frontend dependencies include:
- react
- react-dom
- react-leaflet
- leaflet
- leaflet.markercluster
- chart.js
- react-chartjs-2
- tailwindcss
- date-fns
- typescript
- @types/react
- @types/react-dom
- @types/leaflet

### Backend Setup
1. Navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment (Windows):
```bash
python -m venv venv
.\venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start development server:
```bash
uvicorn main:app --reload
```

Backend dependencies include:
- fastapi
- uvicorn
- requests
- python-dotenv
- python-multipart

## Environment Variables Configuration

### Frontend Environment Variables
Create `.env` file:
```
REACT_APP_API_URL=http://localhost:8000
```

### Backend Environment Variables
Create `.env` file:
```
FIRMS_API_KEY=your_api_key_here
```

## API Documentation

After starting the backend server, access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development Notes

1. Frontend Development:
   - Ensure backend server is running
   - Development server runs on http://localhost:3000
   - Use `npm run build` to create production build
   - Visualization layers can be toggled in the control panel
   - Heatmap and Clusters are always visible
   - Other visualizations (Stats, Trends, Radar) are toggleable

2. Backend Development:
   - Ensure FIRMS API key is correctly set
   - Development server runs on http://localhost:8000
   - Use `uvicorn main:app --host 0.0.0.0 --port 8000` for production server

3. Data Query Limitations:
   - Time span cannot exceed 10 days
   - Start date must be earlier than end date
   - End date cannot exceed today

## Deployment Guide

### Frontend Deployment
1. Create production build:
```bash
cd frontend
npm run build
```

2. Deploy files from the `build` directory to your web server

### Backend Deployment
1. Install production dependencies:
```bash
pip install -r requirements.txt
```

2. Start production server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Troubleshooting

1. Frontend Issues:
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Clear cache: `npm cache clean --force`
   - Check browser console for errors
   - Ensure all visualization layers are properly initialized
   - Verify map container dimensions are correct

2. Backend Issues:
   - Verify FIRMS API key is correct
   - Check log output
   - Ensure all dependencies are properly installed
   - Monitor API rate limits

## Contribution Guidelines

1. Code Style:
   - Frontend: ESLint and Prettier
   - Backend: PEP 8 standards

2. Commit Standards:
   - Use clear commit messages
   - Use separate branches for features or fixes

3. Testing:
   - Frontend: `npm test`
   - Backend: `pytest`

4. Component Development:
   - Follow existing component structure
   - Maintain consistent styling with Tailwind CSS
   - Ensure proper TypeScript typing
   - Add appropriate error handling
   - Include necessary documentation
