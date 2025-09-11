import { useQuery, QueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { SearchParams, FirePoint, FireFeatureCollection, FireFeature } from '../types';

export interface FireQueryParams extends SearchParams {}

export const firesQueryKey = (params: FireQueryParams) => [
  'fires',
  params.mode,
  params.sourcePriority || 'auto',
  params.mode === 'country'
    ? (params.country || '')
    : `${params.west},${params.south},${params.east},${params.north}`,
  params.startDate,
  params.endDate,
  params.format || 'geojson',
];

const fetchFires = async (params: FireQueryParams): Promise<FireFeatureCollection> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.mode === 'country') {
      queryParams.append('country', params.country || '');
    } else {
      queryParams.append('west', params.west!.toString());
      queryParams.append('south', params.south!.toString());
      queryParams.append('east', params.east!.toString());
      queryParams.append('north', params.north!.toString());
    }
    queryParams.append('start_date', params.startDate);
    queryParams.append('end_date', params.endDate);
    if (params.sourcePriority) queryParams.append('sourcePriority', params.sourcePriority);
    if (params.format) queryParams.append('format', params.format);

    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const res = await fetch(`${baseUrl}/fires?${queryParams.toString()}`);
    if (!res.ok) {
      let msg = 'Failed to fetch fire data';
      try {
        const body = await res.json();
        if (body && typeof body === 'object') {
          msg = body.message || body.detail?.message || msg;
        }
      } catch {}
      throw new Error(msg);
    }
    const data = await res.json();
    if (params.format === 'geojson') {
      // Ensure we always return a valid FeatureCollection
      if (data && typeof data === 'object' && data.type === 'FeatureCollection' && Array.isArray((data as any).features)) {
        return data as FireFeatureCollection;
      }
      if (Array.isArray(data)) {
        return { type: 'FeatureCollection', features: [] } as FireFeatureCollection;
      }
      throw new Error('Invalid GeoJSON response');
    }
    const points = data as FirePoint[];
    const features: FireFeature[] = points.map(point => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          typeof point.longitude === 'string' ? parseFloat(point.longitude) : NaN,
          typeof point.latitude === 'string' ? parseFloat(point.latitude) : NaN,
        ],
      },
      properties: point,
    }));
    return { type: 'FeatureCollection', features };
  } catch (err: any) {
    toast.error(err?.message || '获取火点数据失败');
    throw err;
  }
};

export const useFiresQuery = (params: FireQueryParams | undefined) => {
  return useQuery<FireFeatureCollection>({
    queryKey: params ? firesQueryKey(params) : [],
    queryFn: () => fetchFires(params as FireQueryParams),
    enabled: !!params,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  });
};

export const prefetchFires = (client: QueryClient, params: FireQueryParams) => {
  return client.prefetchQuery({
    queryKey: firesQueryKey(params),
    queryFn: () => fetchFires(params),
  });
};
