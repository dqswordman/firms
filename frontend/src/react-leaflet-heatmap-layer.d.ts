declare module '@vgrid/react-leaflet-heatmap-layer' {
  import React from 'react';

  interface HeatmapLayerProps<T = any> {
    points: T[];
    radius?: number;
    blur?: number;
    max?: number;
    maxZoom?: number;
    gradient?: {
      [key: number]: string;
    };
    fitBoundsOnLoad?: boolean;
    fitBoundsOnUpdate?: boolean;
    latitudeExtractor?: (m: T) => number;
    longitudeExtractor?: (m: T) => number;
    intensityExtractor?: (m: T) => number;
  }

  export const HeatmapLayerFactory: <T = any>() => React.FC<HeatmapLayerProps<T>>;
} 