declare module '@vgrid/react-leaflet-heatmap-layer' {
  import { Component } from 'react';

  interface HeatmapLayerProps {
    points: Array<{
      lat: number;
      lng: number;
      intensity: number;
    }>;
    radius?: number;
    blur?: number;
    max?: number;
    gradient?: {
      [key: number]: string;
    };
  }

  export const HeatmapLayerFactory: () => React.FC<HeatmapLayerProps>;
} 