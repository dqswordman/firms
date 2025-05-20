declare module 'react-leaflet-heatmap-layer-v3' {
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

  export class HeatmapLayer extends Component<HeatmapLayerProps> {}
} 