import type { LatLngBoundsExpression } from 'leaflet';
import { FireFeatureCollection } from '../../types';
import { LatLngTuple } from '../../stores/mapStore';

export const extractFirePoints = (collection: FireFeatureCollection | undefined): LatLngTuple[] => {
  if (!collection?.features) {
    return [];
  }

  const points: LatLngTuple[] = [];
  for (const feature of collection.features) {
    if (feature.geometry?.type !== 'Point') {
      continue;
    }
    const [lng, lat] = feature.geometry.coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      continue;
    }
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      continue;
    }
    points.push([lat, lng]);
  }
  return points;
};

export const boundsFromPoints = (points: LatLngTuple[]): LatLngBoundsExpression | null => {
  if (!points.length) {
    return null;
  }

  let minLat = points[0][0];
  let maxLat = points[0][0];
  let minLng = points[0][1];
  let maxLng = points[0][1];

  for (const [lat, lng] of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  if (minLat === maxLat && minLng === maxLng) {
    const delta = 0.25;
    return [
      [minLat - delta, minLng - delta],
      [maxLat + delta, maxLng + delta],
    ];
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
};
