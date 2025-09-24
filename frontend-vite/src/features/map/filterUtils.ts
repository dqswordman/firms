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

const normalizeConfidence = (raw: unknown): 'low' | 'nominal' | 'high' | 'unknown' => {
  if (raw == null) return 'unknown';
  if (typeof raw === 'number') {
    if (raw >= 80) return 'high';
    if (raw >= 30) return 'nominal';
    return 'low';
  }
  const str = String(raw).trim().toLowerCase();
  if (/^\d+$/.test(str)) {
    const num = Number(str);
    if (num >= 80) return 'high';
    if (num >= 30) return 'nominal';
    return 'low';
  }
  if (str === 'h' || str === 'high') return 'high';
  if (str === 'n' || str === 'nominal' || str === 'medium') return 'nominal';
  if (str === 'l' || str === 'low') return 'low';
  return 'unknown';
};

const matchConfidence = (raw: unknown, target: FilterState['confidence']): boolean => {
  if (target === 'all') return true;
  return normalizeConfidence(raw) === target;
};

export const applyFilters = (
  collection: FireFeatureCollection | undefined,
  filters: FilterState
): FireFeatureCollection | undefined => {
  if (!collection) {
    return collection;
  }

  const { frpMin, frpMax, confidence, dateStart, dateEnd } = filters;
  const filtered = collection.features.filter((feature) => {
    const frp = getFrp(feature);
    if (frpMin != null && frp < frpMin) {
      return false;
    }
    if (frpMax != null && frp > frpMax) {
      return false;
    }
    if (!matchConfidence(feature.properties?.confidence, confidence)) {
      return false;
    }

    if (dateStart || dateEnd) {
      const d = (feature.properties?.acq_date as string) || (feature.properties?.acq_datetime as string)?.slice(0, 10);
      if (!d) return false;
      if (dateStart && d < dateStart) return false;
      if (dateEnd && d > dateEnd) return false;
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
