import type { DoctorListParams, PatientListParams, TimeInterval } from '@/lib/types';

/**
 * One factory for every cache key, so invalidation after a mutation can't miss a query
 * by spelling its key slightly differently at the call site. Keys are hierarchical:
 * invalidating `doctors.all` invalidates every doctor list, detail and facet under it.
 */
export const queryKeys = {
  doctors: {
    all: ['doctors'] as const,
    lists: () => [...queryKeys.doctors.all, 'list'] as const,
    list: (params: DoctorListParams) => [...queryKeys.doctors.lists(), params] as const,
    details: () => [...queryKeys.doctors.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.doctors.details(), id] as const,
    patients: (id: string, params: { page: number; limit: number }) =>
      [...queryKeys.doctors.detail(id), 'patients', params] as const,
    facets: () => [...queryKeys.doctors.all, 'facets'] as const,
  },
  patients: {
    all: ['patients'] as const,
    lists: () => [...queryKeys.patients.all, 'list'] as const,
    list: (params: PatientListParams) => [...queryKeys.patients.lists(), params] as const,
    // No `detail` key: there is no patient detail screen. The list rows carry everything
    // the UI shows, and an unused key is one more thing invalidation has to be trusted
    // to cover correctly.
    conditions: () => [...queryKeys.patients.all, 'conditions'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    summary: () => [...queryKeys.dashboard.all, 'summary'] as const,
    timeseries: (interval: TimeInterval) =>
      [...queryKeys.dashboard.all, 'timeseries', interval] as const,
  },
} as const;
