# FIRMS Wildfire Data Visualization System

A global wildfire data visualization system based on NASA FIRMS API, supporting country or region-based queries and time series data display.

## Features

- 🌍 Global wildfire data visualization with interactive map
- 🔍 Country or region-based query support
- 📅 Time series data display with date slider
- 🎯 Detailed wildfire point information
- 📊 Multiple visualization layers:
  - Heatmap (always visible)
  - Clusters (always visible)
  - Statistics Panel (toggleable)
  - Trend Chart (toggleable)
  - Radar Chart (toggleable)
- 📱 Responsive design with modern UI

## Quick Start

### Clone the Project
```bash
git clone https://github.com/yourusername/firms.git
cd firms
```

### Start Backend
1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
Create `.env` file and add your FIRMS API key:
```
FIRMS_API_KEY=your_api_key_here
```

5. Start server:
```bash
uvicorn main:app --reload
```

### Start Frontend
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

Now you can access the application at http://localhost:3000 in your browser.

## Usage Guide

1. Query Methods:
   - Country Query: Enter country code (e.g., CHN for China)
   - Region Query: Enter latitude and longitude range

2. Time Selection:
   - Use time slider to select specific date
   - Use forward/backward buttons to navigate adjacent dates
   - Time span limited to 10 days

3. Visualization Controls:
   - Heatmap and Clusters are always visible
   - Statistics Panel: Toggle to show/hide detailed statistics
   - Trend Chart: Toggle to show/hide fire point trends
   - Radar Chart: Toggle to show/hide FRP and day/night distribution

4. Data Display:
   - Map shows wildfire locations with heatmap and clustering
   - Click on points to view detailed information
   - Support map zoom and pan
   - Multiple visualization layers for comprehensive analysis

## Technology Stack

### Frontend
- React 18
- TypeScript
- Leaflet + react-leaflet
- Leaflet.markercluster
- Chart.js + react-chartjs-2
- Tailwind CSS
- date-fns

### Backend
- FastAPI
- Python 3.8+
- Requests
- python-dotenv

## Development Documentation

For detailed development documentation, please refer to [AGENTS.md](AGENTS.md).

## Contributing

Issues and Pull Requests are welcome!

## License

MIT License
