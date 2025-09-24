import React from 'react';
import { useMapStore } from './stores';
import { QueryPanel } from './features/map/QueryPanel';
import { TimeSlider } from './features/map/TimeSlider';
import { FilterPanel } from './features/map/FilterPanel';
import { StatsPanel } from './features/map/StatsPanel';
import { ChartsPanel } from './features/map/ChartsPanel';
import { MapView } from './features/map/MapView';
import { MeasurementPanel } from './features/map/MeasurementPanel';
import { LayerPanel } from './features/map/LayerPanel';

export const Root: React.FC = () => {
  const showMap = useMapStore((s) => s.showMap);
  const setShowMap = useMapStore((s) => s.setShowMap);

  if (showMap) {
    return (
      <div className="app-map-shell" style={{ position: 'relative', height: '100%' }}>
        <MapView />
        <button
          onClick={() => setShowMap(false)}
          style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 1200, padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid rgba(148,163,184,0.35)', background: 'rgba(15,23,42,0.85)', color: '#e2e8f0', cursor: 'pointer' }}
        >
          ← Back to Dashboard
        </button>
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1100, width: 320, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <LayerPanel />
          <MeasurementPanel />
        </div>
      </div>
    );
  }

  // Dashboard view (no sidebar). Panels stacked vertically.
  return (
    <div style={{ height: '100%', width: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '1rem', maxWidth: 1200, margin: '0 auto', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <h1>FIRMS Wildfire Explorer · Dashboard</h1>
          <p>Search, adjust time window, review analytics and charts. Open the map when you need spatial context.</p>
        </div>
        <QueryPanel />
        <TimeSlider />
        <FilterPanel />
        <StatsPanel />
        <ChartsPanel />
        <div style={{ gridColumn: '1 / -1' }}>
          <button
            onClick={() => setShowMap(true)}
            style={{ padding: '0.8rem 1rem', borderRadius: 10, border: 'none', background: 'linear-gradient(90deg, #38bdf8, #8b5cf6)', color: '#0f172a', fontWeight: 700, cursor: 'pointer' }}
          >
            Open Map
          </button>
        </div>
      </div>
    </div>
  );
};

