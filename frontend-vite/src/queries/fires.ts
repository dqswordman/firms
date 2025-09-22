import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';

type FiresQueryOptions = Omit<UseQueryOptions<FireFeatureCollection, Error, FireFeatureCollection>, 
  "queryKey" | "queryFn" | "enabled"
>;

type FireStatsOptions = Omit<UseQueryOptions<Record<string, unknown>, Error, Record<string, unknown>>, 
  "queryKey" | "queryFn" | "enabled"
>;

import { fetchFires, fetchFireStats } from '../services/fires';
import { FireFeatureCollection, FiresQueryParams } from '../types';

export const fireKeys = {
  all: ['fires'] as const,
  list: (params: FiresQueryParams) => ['fires', params] as QueryKey,
  listDisabled: ['fires', 'disabled'] as const,
  stats: (params?: FiresQueryParams) => ['fires', 'stats', params ?? 'default'] as QueryKey,
};

export function useFiresQuery(
  params: FiresQueryParams | undefined,
  options?: FiresQueryOptions & { enabled?: boolean }
) {
  return useQuery<FireFeatureCollection, Error>({
    queryKey: params ? fireKeys.list(params) : fireKeys.listDisabled,
    queryFn: () => fetchFires(params as FiresQueryParams),
    enabled: options?.enabled ?? Boolean(params),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    ...options,
  });
}

export function useFireStatsQuery(
  params: FiresQueryParams | undefined,
  options?: FireStatsOptions & { enabled?: boolean }
) {
  return useQuery<Record<string, unknown>, Error>({
    queryKey: fireKeys.stats(params),
    queryFn: () => fetchFireStats(params as FiresQueryParams),
    enabled: options?.enabled ?? Boolean(params),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    ...options,
  });
}
