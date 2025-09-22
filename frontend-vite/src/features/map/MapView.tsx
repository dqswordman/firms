import React from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useMapStore } from '../../stores';
import { useFiresQuery } from '../../queries/fires';
import { useMapInteractions } from './hooks/useMapInteractions';
import { useAutoFit } from './hooks/useAutoFit';
import { useMeasureTool } from './hooks/useMeasureTool';

const ViewportSync: React.FC = () => {
  const map = useMap();
  const setViewport = useMapStore((state) => state.setViewport);

  useMapEvents({
    moveend() {
      const center = map.getCenter();
      setViewport({ center: [center.lat, center.lng], zoom: map.getZoom() });
    },
  });

  return null;
};

const MapControllers: React.FC = () => {
  useMapInteractions();
  useAutoFit();
  useMeasureTool();
  return null;
};

export const MapView: React.FC = () => {
  const { viewport, baseLayer, queryParams } = useMapStore();

  useFiresQuery(queryParams ?? undefined, {
    enabled: false,
  });

  const tileUrl =
    baseLayer === 'osm'
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';

  return (
    <MapContainer center={viewport.center} zoom={viewport.zoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url={tileUrl} />
      <ViewportSync />
      <MapControllers />
    </MapContainer>
  );
};
