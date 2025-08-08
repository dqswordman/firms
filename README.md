# FIRMS Wildfire Data Visualization System

A global wildfire data visualization system based on NASA FIRMS API, supporting country or region-based queries and time series data display.

## Features

- Global wildfire data visualization with an interactive map
- Country or region-based query support
- Time series data display with a date slider
- Automatic splitting of date ranges longer than 10 days
- Detailed wildfire point information
- Multiple visualization layers:
  - Heatmap (always visible)
  - Clusters (always visible)
  - Statistics Panel (toggleable)
  - Trend Chart (toggleable)
  - Radar Chart (toggleable)
- Responsive design with a modern interface

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
Create `.env` file and add your FIRMS MAP key:
```
FIRMS_MAP_KEY=your_map_key_here
```
If `FIRMS_MAP_KEY` is not set, the application will fallback to the deprecated `FIRMS_API_KEY` and print a warning.

5. Start server:
```bash
uvicorn main:app --reload
```

The backend now uses NASA FIRMS API v4 endpoints and supports a `source` query parameter (default `VIIRS_SNPP_NRT`).

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
   - Date ranges exceeding 10 days are automatically split into multiple requests

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

## 前端数据获取策略

前端采用 TanStack Query 统一管理火点数据请求：

- 以 `(mode, source, country|bbox, startDate, endDate, format)` 作为缓存键；
- 时间滑块切换日期时，会自动预取相邻的前后一天数据，提高快速切换体验；
- 请求失败时使用指数退避策略重试，最终失败会弹出 Toast 提示；
- 可通过 React Query Devtools 查看缓存命中情况。

## Changelog

### July 2, 2025
- **Frontend Improvements:**
  - Fixed TypeScript errors related to optional fields in FirePoint interface
  - Enhanced components to handle missing data gracefully (FireRadarChart, FireStatsPanel, FireTrendChart)
  - Improved error handling in data visualization components

- **Backend API Updates:**
  - Fixed geographic boundary query to align with NASA FIRMS API specifications
  - Corrected URL construction for area-based queries
  - Added debugging endpoints for easier troubleshooting
  - Maintained backward compatibility for country-based queries

- **General Enhancements:**
  - Increased application robustness for varying data formats
  - Improved error reporting and handling
  - Enhanced data validation throughout the application

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
