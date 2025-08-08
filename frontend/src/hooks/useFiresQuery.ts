import { useQuery, QueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { SearchParams, FirePoint } from '../types';

export interface FireQueryParams extends SearchParams {}

export const firesQueryKey = (params: FireQueryParams) => [
  'fires',
  params.mode,
  params.source || 'modis',
  params.mode === 'country'
    ? params.country
    : `${params.west},${params.south},${params.east},${params.north}`,
  params.startDate,
  params.endDate,
  params.format || 'json',
];

const fetchFires = async (params: FireQueryParams) => {
  const queryParams = new URLSearchParams();
  if (params.mode === 'country') {
    queryParams.append('country', params.country!);
  } else {
    queryParams.append('west', params.west!.toString());
    queryParams.append('south', params.south!.toString());
    queryParams.append('east', params.east!.toString());
    queryParams.append('north', params.north!.toString());
  }
  queryParams.append('start_date', params.startDate);
  queryParams.append('end_date', params.endDate);
  if (params.source) queryParams.append('source', params.source);
  if (params.format) queryParams.append('format', params.format);

  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const res = await fetch(`${baseUrl}/fires?${queryParams.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch fire data');
  }
  return res.json() as Promise<FirePoint[]>;
};

export const useFiresQuery = (params: FireQueryParams | undefined) => {
  return useQuery<FirePoint[]>({
    queryKey: params ? firesQueryKey(params) : [],
    queryFn: () => fetchFires(params as FireQueryParams),
    enabled: !!params,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    onError: (err: any) => {
      toast.error(err.message || '获取火点数据失败');
    },
  });
};

export const prefetchFires = (client: QueryClient, params: FireQueryParams) => {
  return client.prefetchQuery({
    queryKey: firesQueryKey(params),
    queryFn: () => fetchFires(params),
  });
};

