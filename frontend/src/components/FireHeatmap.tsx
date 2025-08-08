import React from 'react';
import { HeatmapLayerFactory } from '@vgrid/react-leaflet-heatmap-layer';
import { FireFeatureCollection } from '../types';

const HeatmapLayer = HeatmapLayerFactory<{ lat: number; lng: number; intensity: number }>();

interface FireHeatmapProps {
  fireCollection: FireFeatureCollection;
  weightBy: 'frp' | 'brightness';
  threshold: number;
}

const FireHeatmap: React.FC<FireHeatmapProps> = ({ fireCollection, weightBy, threshold }) => {
  const points = fireCollection.features
    .map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const props = feature.properties;
      const value = weightBy === 'frp'
        ? parseFloat(props.frp || '0')
        : parseFloat(props.bright_ti4 || '0');
      if (isNaN(lat) || isNaN(lng) || isNaN(value) || value < threshold) return null;
      return { lat, lng, intensity: value };
    })
    .filter(
      (p): p is { lat: number; lng: number; intensity: number } => p !== null
    );

  return (
    <HeatmapLayer
      fitBoundsOnLoad
      fitBoundsOnUpdate
      points={points}
      latitudeExtractor={(m) => m.lat}
      longitudeExtractor={(m) => m.lng}
      intensityExtractor={(m) => m.intensity}
    />
  );
};

export default FireHeatmap;

