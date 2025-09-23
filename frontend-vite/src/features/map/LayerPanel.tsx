import React from 'react';
import { useMapStore } from '../../stores';

export const LayerPanel: React.FC = () => {
  const showPoints = useMapStore((state) => state.showPoints);
  const showClusters = useMapStore((state) => state.showClusters);
  const showHeatmap = useMapStore((state) => state.showHeatmap);
  const setShowPoints = useMapStore((state) => state.setShowPoints);
  const setShowClusters = useMapStore((state) => state.setShowClusters);
  const setShowHeatmap = useMapStore((state) => state.setShowHeatmap);

  return (
    <section className="layer-card">
      <header>
        <h2>Layers</h2>
        <p>Toggle core map layers while Stage 3 rebuilds the rest of the stack.</p>
      </header>
      <div className="layer-toggle-group">
        <label className="layer-toggle">
          <input
            type="checkbox"
            checked={showPoints}
            onChange={(event) => setShowPoints(event.target.checked)}
          />
          <span>Fire points</span>
        </label>
        <label className="layer-toggle">
          <input
            type="checkbox"
            checked={showClusters}
            onChange={(event) => setShowClusters(event.target.checked)}
          />
          <span>Clustered hotspots</span>
        </label>
        <label className="layer-toggle">
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={(event) => setShowHeatmap(event.target.checked)}
          />
          <span>Heatmap intensity</span>
        </label>
      </div>
      <p className="layer-note">Cluster styling mirrors the legacy FRP buckets; additional overlays return in Stage 4 alongside filters and analytics.</p>
    </section>
  );
};
