import { httpClient } from './http';
import { FireFeatureCollection, FirePointProperties, FiresQueryParams } from '../types';

function buildParams(params: FiresQueryParams): Record<string, string> {
  const query = new URLSearchParams();
  if (params.mode === 'country') {
    if (params.country) query.append('country', params.country);
  } else {
    if (params.west != null) query.append('west', params.west.toString());
    if (params.south != null) query.append('south', params.south.toString());
    if (params.east != null) query.append('east', params.east.toString());
    if (params.north != null) query.append('north', params.north.toString());
  }
  query.append('start_date', params.startDate);
  query.append('end_date', params.endDate);
  if (params.sourcePriority) query.append('sourcePriority', params.sourcePriority);
  if (params.format) query.append('format', params.format);
  return Object.fromEntries(query.entries());
}

export async function fetchFires(params: FiresQueryParams): Promise<FireFeatureCollection> {
  const search = buildParams(params);
  const format = params.format ?? 'geojson';
  const response = await httpClient.get('/fires', { params: search });
  if (format === 'geojson') {
    if (response.data?.type === 'FeatureCollection') {
      return response.data as FireFeatureCollection;
    }
    throw new Error('Unexpected response shape: expected FeatureCollection');
  }
  const points = Array.isArray(response.data) ? response.data : [];
  return {
    type: 'FeatureCollection',
    features: points.map((p: FirePointProperties) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [Number(p.longitude) || 0, Number(p.latitude) || 0] },
      properties: p,
    })),
  };
}

export async function fetchFireStats(params: FiresQueryParams): Promise<Record<string, unknown>> {
  const search = buildParams(params);
  const response = await httpClient.get('/fires/stats', { params: search });
  return response.data ?? {};
}
