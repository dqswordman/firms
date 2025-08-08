import React, { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import FireHeatmap from './FireHeatmap';
import FireCluster from './FireCluster';
import FireStatsPanel from './FireStatsPanel';
import FireTrendChart from './FireTrendChart';
import FireRadarChart from './FireRadarChart';
import SearchForm from './SearchForm';
import TimeSlider from './TimeSlider';
import { FirePoint, SearchParams } from '../types';

interface FireMapProps {
  firePoints: FirePoint[];
  onSearch: (params: any) => void;
  dates: string[];
  currentDate: string;
  onDateChange: (date: string) => void;
  searchParams: SearchParams | null;
}

const FireMap: React.FC<FireMapProps> = ({ firePoints, onSearch, dates, currentDate, onDateChange, searchParams }) => {
  const [showStats, setShowStats] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [showRadar, setShowRadar] = useState(false);

  const renderVisualizationControls = () => (
    <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-lg">
      <h3 className="font-semibold mb-2">Visualization Controls</h3>
      <div className="space-y-2">
        <div className="text-sm text-gray-500 mb-2">
          <p>Heatmap and Clusters are always visible</p>
        </div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showStats}
            onChange={(e) => setShowStats(e.target.checked)}
            className="form-checkbox"
          />
          <span>Statistics</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showTrends}
            onChange={(e) => setShowTrends(e.target.checked)}
            className="form-checkbox"
          />
          <span>Trends</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showRadar}
            onChange={(e) => setShowRadar(e.target.checked)}
            className="form-checkbox"
          />
          <span>Radar Chart</span>
        </label>
      </div>
    </div>
  );

  const renderMap = () => (
    <MapContainer
      center={[35.0, 105.0]}
      zoom={4}
      className="flex-grow w-full h-full"
      style={{ height: '100vh' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {firePoints.length > 0 && (
        <>
          <FireHeatmap firePoints={firePoints} />
          <FireCluster firePoints={firePoints} />
        </>
      )}
    </MapContainer>
  );

  const renderCharts = () => {
    if (firePoints.length === 0) return null;

    return (
      <div className="absolute bottom-20 left-4 right-4 z-[1000] space-y-4">
        {showStats && (
          <div key="stats">
            <FireStatsPanel
              firePoints={firePoints}
              currentDate={currentDate}
            />
          </div>
        )}
        {showTrends && dates.length > 0 && (
          <div key="trends">
            <FireTrendChart
              firePoints={firePoints}
              startDate={new Date(dates[0])}
              endDate={new Date(dates[dates.length - 1])}
            />
          </div>
        )}
        {showRadar && (
          <div key="radar">
            <FireRadarChart firePoints={firePoints} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Search Form */}
      <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg">
        <SearchForm onSearch={onSearch} />
      </div>

      {/* Visualization Controls */}
      {renderVisualizationControls()}

      {/* Main Map */}
      {renderMap()}

      {/* Time Slider */}
      {firePoints.length > 0 && dates.length > 0 && searchParams && (
        <TimeSlider
          dates={dates}
          currentDate={currentDate}
          onTimeChange={onDateChange}
          params={searchParams}
        />
      )}

      {/* Statistics and Charts Panel */}
      {renderCharts()}
    </div>
  );
};

export default FireMap;
