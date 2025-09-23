import { FireFeatureCollection } from '../../types';
import { FilterState } from '../../stores/mapStore';

const getFrp = (feature: FireFeatureCollection['features'][number]): number => {
  const raw = feature.properties?.frp ?? feature.properties?.FRP ?? feature.properties?.FRPValue;
  if (raw == null) {
    return 0;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getConfidence = (feature: FireFeatureCollection['features'][number]): string => {
  const raw = feature.properties?.confidence;
  if (raw == null) {
    return 'unknown';
  }
  const value = typeof raw === 'number' ? raw.toString() : String(raw);
  return value.toLowerCase();
};

const matchConfidence = (confidence: string, target: FilterState['confidence']): boolean => {
  if (target === 'all') {
    return true;
  }
  return confidence.includes(target);
};

export const applyFilters = (
  collection: FireFeatureCollection | undefined,
  filters: FilterState
): FireFeatureCollection | undefined => {
  if (!collection) {
    return collection;
  }

  const { frpMin, frpMax, confidence } = filters;
  const filtered = collection.features.filter((feature) => {
    const frp = getFrp(feature);
    if (frpMin != null && frp < frpMin) {
      return false;
    }
    if (frpMax != null && frp > frpMax) {
      return false;
    }
    if (!matchConfidence(getConfidence(feature), confidence)) {
      return false;
    }
    return true;
  });

  if (filtered.length === collection.features.length) {
    return collection;
  }

  return {
    ...collection,
    features: filtered,
  };
};
