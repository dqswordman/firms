import React from 'react';
import { MapView } from './features/map/MapView';
import { MeasurementPanel } from './features/map/MeasurementPanel';
import { LayerPanel } from './features/map/LayerPanel';
import { QueryPanel } from './features/map/QueryPanel';
import { FilterPanel } from './features/map/FilterPanel';
import { TimeSlider } from './features/map/TimeSlider';
import { StatsPanel } from './features/map/StatsPanel';

const App: React.FC = () => {
  return (
    <div className="app-root">
      <aside className="app-sidebar">
        <h1>FIRMS Wildfire Explorer vNext</h1>
        <p>Stage 3 focuses on the map核心：查询、图层与测量逐步迁移至新架构。</p>
        <QueryPanel />
        <TimeSlider />
        <FilterPanel />
        <StatsPanel />
        <LayerPanel />
        <MeasurementPanel />
        <p className="sidebar-note">后续 Stage 4 将迁移过滤器、分析面板与共享功能。</p>
      </aside>
      <main className="app-map-shell">
        <MapView />
      </main>
    </div>
  );
};

export default App;
