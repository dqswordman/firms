import { describe, expect, it } from 'vitest';
import { buildClusterIndex, toClusterPoints } from '../features/map/clusterUtils';
import type { FireFeatureCollection } from '../types';

const buildFeatureCollection = (points: Array<[number, number, number?]>): FireFeatureCollection => ({
  type: 'FeatureCollection',
  features: points.map(([lng, lat, frp = 0], index) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    properties: {
      frp,
      id: index,
    },
  })),
});

describe('cluster utils', () => {
  it('converts fire features into cluster-ready points', () => {
    const collection: FireFeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-120.5, 35.2] },
          properties: { frp: 120 },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-120.5, Number.NaN] },
          properties: {},
        },
        {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [] },
          properties: {},
        },
      ],
    } as unknown as FireFeatureCollection;

    const points = toClusterPoints(collection);
    expect(points).toHaveLength(1);
    expect(points[0].properties?.frp).toBe(120);
  });

  it('builds a cluster index that groups nearby points', () => {
    const collection = buildFeatureCollection([
      [-120.5, 35.2, 50],
      [-120.51, 35.21, 75],
      [-119.8, 36.0, 20],
    ]);

    const index = buildClusterIndex(collection);
    const clusters = index.getClusters([-121, 34.5, -119, 36.5], 6);
    const clusterCount = clusters.filter((feature) => {
      const props = feature.properties as { cluster?: boolean };
      return Boolean(props.cluster);
    }).length;
    expect(clusterCount).toBeGreaterThanOrEqual(1);
  });
});
