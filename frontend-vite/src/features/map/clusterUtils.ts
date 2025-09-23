import Supercluster from 'supercluster';
import type { FireFeatureCollection } from '../../types';

export interface ClusterProperties {
  frp?: number;
  originalIndex?: number;
  dummy?: boolean;
}

type ClusterPoint = Supercluster.PointFeature<ClusterProperties>;

const parseCoordinate = (value: unknown): number | null => {
  if (typeof value !== 'number') {
    return null;
  }
  if (!Number.isFinite(value)) {
    return null;
  }
  return value;
};

export const toClusterPoints = (collection?: FireFeatureCollection): ClusterPoint[] => {
  if (!collection?.features) {
    return [];
  }

  const points: ClusterPoint[] = [];
  collection.features.forEach((feature, index) => {
    if (feature.geometry?.type !== 'Point') {
      return;
    }

    const [lngRaw, latRaw] = feature.geometry.coordinates;
    const lat = parseCoordinate(latRaw);
    const lng = parseCoordinate(lngRaw);
    if (lat == null || lng == null) {
      return;
    }

    points.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties: {
        originalIndex: index,
        frp: Number(feature.properties?.frp ?? feature.properties?.FRP ?? 0),
      },
    });
  });

  return points;
};

export const buildClusterIndex = (collection?: FireFeatureCollection) => {
  const index = new Supercluster<ClusterProperties>({ radius: 60, maxZoom: 13, minPoints: 2 });
  const points = toClusterPoints(collection);
  index.load(points);
  return index;
};
