import React from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import type { LeafletEvent } from 'leaflet';
import { useMapStore } from '../../stores';
import { useFiresQuery } from '../../queries/fires';

const ViewportSync: React.FC = () => {
  const setViewport = useMapStore((state) => state.setViewport);
  useMapEvents({
    moveend(event: LeafletEvent) {
      const map = event.target as any;
      const center = map.getCenter();
      setViewport({ center: [center.lat, center.lng], zoom: map.getZoom() });
    },
  });
  return null;
};

export const MapView: React.FC = () => {
  const { viewport, baseLayer, queryParams } = useMapStore();

  useFiresQuery(queryParams ?? undefined, {
    enabled: false,
  });

  const tileUrl = baseLayer === 'osm'
    ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    : 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';

  return (
    <MapContainer center={viewport.center} zoom={viewport.zoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url={tileUrl} />
      <ViewportSync />
    </MapContainer>
  );
};
