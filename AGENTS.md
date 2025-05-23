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
