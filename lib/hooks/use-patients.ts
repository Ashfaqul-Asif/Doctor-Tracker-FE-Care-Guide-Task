'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Paginated, Patient, PatientListParams } from '@/lib/types';

export function usePatients(params: PatientListParams) {
  return useQuery({
    queryKey: queryKeys.patients.list(params),
    queryFn: ({ signal }) => api.get<Paginated<Patient>>('/api/patients', params, signal),
    placeholderData: keepPreviousData,
  });
}

export function usePatientConditions() {
  return useQuery({
    queryKey: queryKeys.patients.conditions(),
    queryFn: ({ signal }) =>
      api.get<{ conditions: string[] }>('/api/patients/conditions', undefined, signal),
    select: (data) => data.conditions,
    staleTime: 5 * 60 * 1000,
  });
}

export type PatientInput = {
  name: string;
  condition: string;
  doctorId: string;
  contactInfo: string;
};

/**
 * Every patient mutation touches three things: the patient lists, the owning doctor's
 * `patientCount`, and every dashboard aggregate. Invalidating all three from one place
 * is why the key factory exists.
 */
function useInvalidatePatientViews() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };
}

export function useCreatePatient() {
  const invalidate = useInvalidatePatientViews();

  return useMutation({
    mutationFn: (input: PatientInput) => api.post<Patient>('/api/patients', input),
    onSuccess: invalidate,
  });
}

export function useUpdatePatient(id: string) {
  const invalidate = useInvalidatePatientViews();

  return useMutation({
    mutationFn: (input: Partial<PatientInput>) => api.patch<Patient>(`/api/patients/${id}`, input),
    onSuccess: invalidate,
  });
}

/** Soft delete — the record is retained server-side (FR-13, FR-17). */
export function useRemovePatient() {
  const invalidate = useInvalidatePatientViews();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/patients/${id}`),
    onSuccess: invalidate,
  });
}
