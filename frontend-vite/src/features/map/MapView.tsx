import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useMapStore } from '../../stores';
import { useFiresQuery } from '../../queries/fires';
import { useMapInteractions } from './hooks/useMapInteractions';
import { useAutoFit } from './hooks/useAutoFit';
import { useMeasureTool } from './hooks/useMeasureTool';
import { MeasurementOverlay } from './MeasurementOverlay';
import { FiresClusterLayer, FiresHeatmapLayer, FiresPointsLayer } from './FiresLayer';
import { HeatmapLegend } from './HeatmapLegend';
import { ClusterLegend } from './ClusterLegend';
import { extractFirePoints, boundsFromPoints } from './fireUtils';
import { applyFilters } from './filterUtils';

const MAP_PADDING: [number, number] = [48, 48];

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
  const { viewport, baseLayer, queryParams, showPoints, showClusters, showHeatmap, filters } = useMapStore((state) => ({
    viewport: state.viewport,
    baseLayer: state.baseLayer,
    queryParams: state.queryParams,
    showPoints: state.showPoints,
    showClusters: state.showClusters,
    showHeatmap: state.showHeatmap,
    filters: state.filters,
  }));
  const requestAutoFit = useMapStore((state) => state.requestAutoFit);

  const enableQueries = import.meta.env.MODE !== 'test';

  const {
    data,
    isFetching,
    isError,
    error,
  } = useFiresQuery(queryParams ?? undefined, {
    enabled: enableQueries && Boolean(queryParams),
    retry: enableQueries ? 2 : 0,
  });

  const lastFitSignature = useRef<string | null>(null);
  const filteredData = useMemo(() => applyFilters(data, filters), [data, filters]);

  useEffect(() => {
    if (!enableQueries || !filteredData || !queryParams) {
      return;
    }

    const points = extractFirePoints(filteredData);
    if (!points.length) {
      lastFitSignature.current = `${JSON.stringify(queryParams)}::empty`;
      return;
    }

    const signature = `${JSON.stringify(queryParams)}::${points
      .map(([lat, lng]) => `${lat.toFixed(4)}:${lng.toFixed(4)}`)
      .join('|')}`;

    if (signature === lastFitSignature.current) {
      return;
    }

    const bounds = boundsFromPoints(points);
    if (bounds) {
      lastFitSignature.current = signature;
      requestAutoFit(bounds, MAP_PADDING);
    }
  }, [data, enableQueries, requestAutoFit, queryParams]);

  const tileUrl =
    baseLayer === 'osm'
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';

  const statusMessage = useMemo(() => {
    if (!enableQueries) {
      return undefined;
    }

    if (isError) {
      return error?.message ?? 'Failed to load fire data.';
    }

    if (isFetching) {
      return 'Loading recent fire activity...';
    }

    if (filteredData && filteredData.features.length === 0) {
      return 'No fire detections found for the selected range.';
    }

    return undefined;
  }, [enableQueries, error, filteredData, isError, isFetching]);

  return (
    <div className="map-view-root">
      <MapContainer center={viewport.center} zoom={viewport.zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url={tileUrl} />
        <ViewportSync />
        <MapControllers />
        {showPoints ? <FiresPointsLayer collection={filteredData ?? data} /> : null}
        {showClusters ? <FiresClusterLayer collection={filteredData ?? data} /> : null}
        {showHeatmap ? <FiresHeatmapLayer collection={filteredData ?? data} /> : null}
        <MeasurementOverlay />
      </MapContainer>
      {showClusters ? <ClusterLegend /> : null}
      {showHeatmap ? <HeatmapLegend /> : null}
      {statusMessage ? (
        <div className="map-status" role="status">
          <span>{statusMessage}</span>
        </div>
      ) : null}
    </div>
  );
};
