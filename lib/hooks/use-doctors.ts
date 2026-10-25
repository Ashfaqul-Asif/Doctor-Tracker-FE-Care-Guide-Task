'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type {
  Doctor,
  DoctorFacets,
  DoctorListParams,
  Paginated,
  Patient,
} from '@/lib/types';

/**
 * Server state lives in TanStack Query's cache — never mirrored into Zustand. Two
 * copies of the same list is how a table ends up showing data the server disagrees with.
 */

export function useDoctors(params: DoctorListParams) {
  return useQuery({
    queryKey: queryKeys.doctors.list(params),
    queryFn: ({ signal }) => api.get<Paginated<Doctor>>('/api/doctors', params, signal),
    // Keeps the previous page on screen while the next one loads, so paging doesn't
    // collapse the table to a spinner and bounce the scroll position.
    placeholderData: keepPreviousData,
  });
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: queryKeys.doctors.detail(id),
    queryFn: ({ signal }) => api.get<Doctor>(`/api/doctors/${id}`, undefined, signal),
    enabled: Boolean(id),
  });
}

export function useDoctorPatients(id: string, params: { page: number; limit: number }) {
  return useQuery({
    queryKey: queryKeys.doctors.patients(id, params),
    queryFn: ({ signal }) =>
      api.get<Paginated<Patient>>(`/api/doctors/${id}/patients`, params, signal),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  });
}

export function useDoctorFacets() {
  return useQuery({
    queryKey: queryKeys.doctors.facets(),
    queryFn: ({ signal }) => api.get<DoctorFacets>('/api/doctors/facets', undefined, signal),
    // The server caches these for minutes; re-fetching them on every mount would be
    // asking a question we already know the answer to.
    staleTime: 5 * 60 * 1000,
  });
}

export type DoctorInput = {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
};

export function useCreateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DoctorInput) => api.post<Doctor>('/api/doctors', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      // A new doctor changes the roster totals and the distribution chart.
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useUpdateDoctor(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<DoctorInput>) => api.patch<Doctor>(`/api/doctors/${id}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
