# AGENT Instructions

This repository contains a wildfire visualization system built with React (frontend) and FastAPI (backend).

## Structure
- **backend/** – FastAPI application (`main.py`) and helper scripts.
- **frontend/** – React app created with Create React App and Tailwind CSS.

## Development Setup
1. Install Python packages:
   ```bash
   pip install -r backend/requirements.txt
   ```
   Ensure environment variable `FIRMS_API_KEY` is defined (can be stored in a `.env` file).
2. Start the API server:
   ```bash
   uvicorn backend.main:app --reload
   ```
3. Install Node packages and run the frontend:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Testing
- Run React tests (if any) with `npm test` inside `frontend`.
- Basic API test script is `python backend/test_api.py`. Dependencies like `requests` are required.

## Notes
- Python bytecode, virtual environments, and node modules are ignored via `.gitignore`.
- The backend reads the NASA FIRMS API key from the `FIRMS_API_KEY` environment variable.
