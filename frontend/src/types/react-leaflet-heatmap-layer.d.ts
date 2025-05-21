declare module '@vgrid/react-leaflet-heatmap-layer' {
  import { Component } from 'react';
  import { LatLng } from 'leaflet';

  interface HeatmapLayerProps {
    points: (LatLng & { intensity: number })[];
    radius?: number;
    blur?: number;
    maxZoom?: number;
    max?: number;
    gradient?: { [key: number]: string };
    zoomScale?: (zoom: number) => number;
  }

  export function HeatmapLayerFactory(): React.FC<HeatmapLayerProps>;
} 