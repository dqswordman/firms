import React, { useEffect, useMemo, useState } from 'react';
import L, { type LatLngExpression } from 'leaflet';
import { CircleMarker, GeoJSON, LayerGroup, Marker, useMap } from 'react-leaflet';
import type { GeoJsonObject } from 'geojson';
import type { FireFeatureCollection } from '../../types';
import { buildClusterIndex, type ClusterProperties } from './clusterUtils';
import type Supercluster from 'supercluster';

const pointStyle = {
  radius: 5,
  fillColor: '#fb7185',
  color: '#fb7185',
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8,
};

const heatmapStyle = (frp: number | undefined) => {
  const clamped = Math.min(Math.max(frp ?? 0, 0), 400);
  const radius = 8 + clamped / 25;
  let fillColor = '#4ade80';
  if (clamped >= 300) {
    fillColor = '#f97316';
  } else if (clamped >= 150) {
    fillColor = '#fb7185';
  } else if (clamped >= 60) {
    fillColor = '#38bdf8';
  }
  return {
    radius,
    fillColor,
    color: fillColor,
    weight: 0,
    opacity: 0,
    fillOpacity: 0.65,
  };
};

export interface FiresLayerProps {
  collection?: FireFeatureCollection;
}

const toGeoJson = (collection?: FireFeatureCollection): GeoJsonObject => {
  if (!collection) {
    return { type: 'FeatureCollection', features: [] } as GeoJsonObject;
  }
  return collection as unknown as GeoJsonObject;
};

export const FiresPointsLayer: React.FC<FiresLayerProps> = ({ collection }) => {
  const data = useMemo(() => toGeoJson(collection), [collection]);

  return (
    <GeoJSON
      key="fires-points"
      data={data}
      pointToLayer={(_, latlng) => L.circleMarker(latlng, pointStyle)}
    />
  );
};

export const FiresHeatmapLayer: React.FC<FiresLayerProps> = ({ collection }) => {
  const data = useMemo(() => toGeoJson(collection), [collection]);

  return (
    <GeoJSON
      key="fires-heatmap"
      data={data}
      pointToLayer={(feature, latlng) => {
        const frpValue = Number(feature?.properties?.frp ?? feature?.properties?.FRP ?? 0);
        return L.circleMarker(latlng, heatmapStyle(Number.isNaN(frpValue) ? 0 : frpValue));
      }}
    />
  );
};

const createClusterIcon = (count: number) => {
  const size = Math.max(32, Math.min(24 + count * 1.2, 52));
  return L.divIcon({
    html: `<div class="cluster-bubble" style="width:${size}px;height:${size}px;">${count}</div>`,
    className: '',
    iconSize: [size, size],
  });
};

type ClusterFeature = Supercluster.ClusterFeature<ClusterProperties>;
type ClusterPoint = Supercluster.PointFeature<ClusterProperties>;
type ClusterItem = ClusterFeature | ClusterPoint;

const isClusterFeature = (feature: ClusterItem): feature is ClusterFeature =>
  Boolean((feature.properties as { cluster?: boolean }).cluster);

export const FiresClusterLayer: React.FC<FiresLayerProps> = ({ collection }) => {
  const map = useMap();
  const clusterIndex = useMemo(() => buildClusterIndex(collection), [collection]);
  const [clusterItems, setClusterItems] = useState<ClusterItem[]>([]);

  useEffect(() => {
    if (!collection) {
      setClusterItems([]);
      return;
    }

    const updateClusters = () => {
      const bounds = map.getBounds();
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];
      const zoom = Math.round(map.getZoom());
      setClusterItems(clusterIndex.getClusters(bbox, zoom));
    };

    updateClusters();
    map.on('moveend', updateClusters);
    map.on('zoomend', updateClusters);

    return () => {
      map.off('moveend', updateClusters);
      map.off('zoomend', updateClusters);
    };
  }, [collection, clusterIndex, map]);

  if (!collection) {
    return null;
  }

  return (
    <LayerGroup key="fires-clusters">
      {clusterItems.map((feature, index) => {
        const [lng, lat] = feature.geometry.coordinates;
        const position: LatLngExpression = [lat, lng];

        if (isClusterFeature(feature)) {
          const clusterId = (feature.properties as { cluster_id: number }).cluster_id;
          const count = (feature.properties as { point_count: number }).point_count;
          return (
            <Marker
              key={`cluster-${clusterId}`}
              position={position}
              icon={createClusterIcon(count)}
              eventHandlers={{
                click: () => {
                  const nextZoom = Math.min(clusterIndex.getClusterExpansionZoom(clusterId), 18);
                  map.setView(position, nextZoom, { animate: true });
                },
              }}
            />
          );
        }

        const props = feature.properties as ClusterProperties;
        const pointKey = props.originalIndex ?? index;
        return (
          <CircleMarker
            key={`cluster-point-${pointKey}`}
            center={position}
            pathOptions={pointStyle}
            radius={pointStyle.radius}
          />
        );
      })}
    </LayerGroup>
  );
};
