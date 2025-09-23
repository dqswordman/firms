import { describe, expect, it } from 'vitest';
import { extractFirePoints, boundsFromPoints } from '../features/map/fireUtils';
import type { FireFeatureCollection } from '../types';

const buildCollection = (coordinates: Array<[number, number]>): FireFeatureCollection => ({
  type: 'FeatureCollection',
  features: coordinates.map(([lng, lat], index) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    properties: {
      id: index,
    },
  })),
});

describe('fire utils', () => {
  it('extracts numeric coordinates from a collection', () => {
    const collection: FireFeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-120.5, 35.2] },
          properties: {},
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-119.1, 36.9] },
          properties: {},
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [Number.NaN, 0] },
          properties: {},
        },
      ],
    };

    const points = extractFirePoints(collection);
    expect(points).toEqual([
      [35.2, -120.5],
      [36.9, -119.1],
    ]);
  });

  it('returns bounds for a set of points', () => {
    const points = extractFirePoints(buildCollection([
      [-120.5, 35.2],
      [-118.9, 34.7],
      [-121.3, 36.1],
    ]));

    const bounds = boundsFromPoints(points);
    expect(bounds).toEqual([
      [34.7, -121.3],
      [36.1, -118.9],
    ]);
  });

  it('expands bounds when all points are identical', () => {
    const points = extractFirePoints(buildCollection([[-120.5, 35.2], [-120.5, 35.2]]));
    const bounds = boundsFromPoints(points);
    expect(bounds).toEqual([
      [34.95, -120.75],
      [35.45, -120.25],
    ]);
  });
});
