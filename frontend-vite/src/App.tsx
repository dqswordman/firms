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
        <p>Stage 3 focuses on the map���ģ���ѯ��ͼ���������Ǩ�����¼ܹ���</p>
        <QueryPanel />
        <TimeSlider />
        <FilterPanel />
        <StatsPanel />
        <LayerPanel />
        <MeasurementPanel />
        <p className="sidebar-note">���� Stage 4 ��Ǩ�ƹ���������������빲���ܡ�</p>
      </aside>
      <main className="app-map-shell">
        <MapView />
      </main>
    </div>
  );
};

export default App;
