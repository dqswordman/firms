import React from 'react';
import { MapView } from './features/map/MapView';
import { MeasurementPanel } from './features/map/MeasurementPanel';
import { LayerPanel } from './features/map/LayerPanel';

const App: React.FC = () => {
  return (
    <div className="app-root">
      <aside className="app-sidebar">
        <h1>FIRMS Wildfire Explorer vNext</h1>
        <p>Stage 3 focuses on the map core: hardening measurement, auto-fit, and layer orchestration ahead of data integration.</p>
        <LayerPanel />
        <MeasurementPanel />
        <p className="sidebar-note">Clustered overlays, analytics, and filters join once Stage 4 migrates the legacy UI.</p>
      </aside>
      <main className="app-map-shell">
        <MapView />
      </main>
    </div>
  );
};

export default App;
