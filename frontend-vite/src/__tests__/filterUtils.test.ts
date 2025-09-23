import { describe, expect, it } from 'vitest';
import { applyFilters } from '../features/map/filterUtils';
import type { FireFeatureCollection } from '../types';
import type { FilterState } from '../stores/mapStore';

const buildCollection = (values: Array<{ frp?: number; confidence?: string }>): FireFeatureCollection => ({
  type: 'FeatureCollection',
  features: values.map((value, index) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [index, index] },
    properties: {
      frp: value.frp,
      confidence: value.confidence,
    },
  })),
});

describe('filter utils', () => {
  const baseFilters: FilterState = {
    frpMin: null,
    frpMax: null,
    confidence: 'all',
  };

  it('returns original collection when no filters apply', () => {
    const collection = buildCollection([{ frp: 10 }, { frp: 200 }]);
    const result = applyFilters(collection, baseFilters);
    expect(result).toBe(collection);
  });

  it('filters by FRP range', () => {
    const collection = buildCollection([{ frp: 5 }, { frp: 80 }, { frp: 160 }]);
    const result = applyFilters(collection, { ...baseFilters, frpMin: 50, frpMax: 150 });
    expect(result?.features).toHaveLength(1);
    expect(result?.features[0].properties?.frp).toBe(80);
  });

  it('filters by confidence level', () => {
    const collection = buildCollection([
      { frp: 20, confidence: 'low' },
      { frp: 25, confidence: 'nominal' },
      { frp: 30, confidence: 'high' },
    ]);
    const result = applyFilters(collection, { ...baseFilters, confidence: 'high' });
    expect(result?.features).toHaveLength(1);
    expect(result?.features[0].properties?.confidence).toBe('high');
  });
});
