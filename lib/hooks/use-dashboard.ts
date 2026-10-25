'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { DashboardSummary, TimeInterval, TimeseriesResponse } from '@/lib/types';

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: ({ signal }) => api.get<DashboardSummary>('/api/dashboard/summary', undefined, signal),
    // The API caches these aggregates anyway; matching that here avoids a round trip
    // that can only return the same numbers.
    staleTime: 60 * 1000,
  });
}

export function useDashboardTimeseries(interval: TimeInterval) {
  return useQuery({
    queryKey: queryKeys.dashboard.timeseries(interval),
    queryFn: ({ signal }) =>
      api.get<TimeseriesResponse>('/api/dashboard/timeseries', { interval }, signal),
    staleTime: 60 * 1000,
    // Switching day → week keeps the old chart drawn until the new data lands, instead
    // of blanking the panel.
    placeholderData: keepPreviousData,
  });
}
