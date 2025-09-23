import React from 'react';

export const HeatmapLegend: React.FC = () => {
  return (
    <div className="heatmap-legend">
      <span className="heatmap-legend__title">Heatmap FRP (MW)</span>
      <div className="heatmap-legend__gradient">
        <span>0</span>
        <span>60</span>
        <span>150</span>
        <span>300+</span>
      </div>
    </div>
  );
};
