import React from 'react';
import { HeatmapLayerFactory } from '@vgrid/react-leaflet-heatmap-layer';
import { useMap, useMapEvents } from 'react-leaflet';
import { FireFeatureCollection } from '../types';

const HeatmapLayer = HeatmapLayerFactory<{ lat: number; lng: number; intensity: number }>();

interface FireHeatmapProps {
  fireCollection: FireFeatureCollection;
  weightBy: 'frp' | 'brightness';
  threshold: number;
  max?: number;
}

type HeatPoint = { lat: number; lng: number; intensity: number };

const FireHeatmap: React.FC<FireHeatmapProps> = ({ fireCollection, weightBy, threshold, max }) => {
  // Professional viridis-like gradient
  const gradient = {
    0.0: '#440154',
    0.25: '#3b528b',
    0.5: '#21918c',
    0.75: '#5ec962',
    1.0: '#fde725',
  } as Record<number, string>;
  const points: HeatPoint[] = fireCollection.features
    .map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const props = feature.properties;
      let value: number = 0;
      if (weightBy === 'frp') {
        const raw = (props.frp as any);
        value = typeof raw === 'number' ? raw : parseFloat(raw || '0');
      } else {
        // brightness: prefer normalized brightness, fallback to raw TI4 value
        const rawBrightness = (props.brightness as any);
        if (typeof rawBrightness === 'number') {
          value = rawBrightness;
        } else {
          value = parseFloat((props.bright_ti4 as any) || '0');
        }
      }
      if (isNaN(lat) || isNaN(lng) || isNaN(value) || value < threshold) return null;
      return { lat, lng, intensity: value } as HeatPoint;
    })
    .filter((p): p is HeatPoint => p !== null);

  // Dynamic radius/blur by zoom for balanced visuals
  const map = useMap();
  const [zoom, setZoom] = React.useState<number>(map.getZoom());
  useMapEvents({ zoomend() { setZoom(map.getZoom()); } });

  // Larger radius at low zoom, smaller at high zoom
  const radius = Math.max(6, 22 - Math.round(zoom));
  const blur = Math.max(8, Math.round(radius * 1.2));

  return (
    <HeatmapLayer
      fitBoundsOnLoad
      fitBoundsOnUpdate
      points={points}
      radius={radius}
      blur={blur}
      gradient={gradient}
      max={max && max > 0 ? max : undefined}
      latitudeExtractor={(m: HeatPoint) => m.lat}
      longitudeExtractor={(m: HeatPoint) => m.lng}
      intensityExtractor={(m: HeatPoint) => m.intensity}
    />
  );
};

export default FireHeatmap;
