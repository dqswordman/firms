import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import FireHeatmap from './FireHeatmap';
import FireCluster from './FireCluster';
import FireStatsPanel from './FireStatsPanel';
import FireTrendChart from './FireTrendChart';
import FireRadarChart from './FireRadarChart';
import SearchForm from './SearchForm';
import TimeSlider from './TimeSlider';
import { FireFeatureCollection, FirePoint, SearchParams } from '../types';

interface FireMapProps {
  fireCollection: FireFeatureCollection;
  onSearch: (params: any) => void;
  dates: string[];
  currentDate: string;
  onDateChange: (date: string) => void;
  searchParams: SearchParams | null;
}

const FireMap: React.FC<FireMapProps> = ({ fireCollection, onSearch, dates, currentDate, onDateChange, searchParams }) => {
  const firePoints = useMemo(() => fireCollection.features.map(f => f.properties as FirePoint), [fireCollection]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showCluster, setShowCluster] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [weightBy, setWeightBy] = useState<'frp' | 'brightness'>('frp');
  const [threshold, setThreshold] = useState(0);
  const maxWeight = useMemo(() => {
    const values = firePoints.map(p => parseFloat(weightBy === 'frp' ? p.frp || '0' : p.bright_ti4 || '0')).filter(v => !isNaN(v));
    return values.length > 0 ? Math.max(...values) : 0;
  }, [firePoints, weightBy]);

  const renderVisualizationControls = () => (
    <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-lg">
      <h3 className="font-semibold mb-2">Visualization Controls</h3>
      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={(e) => setShowHeatmap(e.target.checked)}
            className="form-checkbox"
          />
          <span>Heatmap</span>
        </label>
        {showHeatmap && (
          <div className="ml-4 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Weight by:</span>
              <select
                value={weightBy}
                onChange={(e) => setWeightBy(e.target.value as 'frp' | 'brightness')}
                className="border rounded p-1 text-sm"
              >
                <option value="frp">FRP</option>
                <option value="brightness">Brightness</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Threshold: {threshold.toFixed(0)}</label>
              <input
                type="range"
                min={0}
                max={Math.max(maxWeight, 1)}
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showCluster}
            onChange={(e) => setShowCluster(e.target.checked)}
            className="form-checkbox"
          />
          <span>Clusters</span>
        </label>
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
      {fireCollection.features.length > 0 && (
        <>
          {showHeatmap && (
            <FireHeatmap
              fireCollection={fireCollection}
              weightBy={weightBy}
              threshold={threshold}
            />
          )}
          {showCluster && <FireCluster fireCollection={fireCollection} />}
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
