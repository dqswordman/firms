# FIRMS Wildfire Data Visualization System

A global wildfire data visualization system based on NASA FIRMS API, supporting country or region-based queries and time series data display.

## Features

- 🌍 Global wildfire data visualization
- 🔍 Country or region-based query support
- 📅 Time series data display
- 🎯 Detailed wildfire point information
- 📊 Wildfire intensity heat map
- 📱 Responsive design

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

3. Data Display:
   - Map shows wildfire locations and intensity
   - Click on points to view detailed information
   - Support map zoom and pan

## Technology Stack

### Frontend
- React 18
- TypeScript
- Leaflet
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
