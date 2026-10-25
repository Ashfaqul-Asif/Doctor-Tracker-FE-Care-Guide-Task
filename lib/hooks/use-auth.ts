'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { LoginResponse } from '@/lib/types';

export function useLogin() {
  const setUser = useAuthStore((state) => state.setUser);
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.post<LoginResponse>('/api/auth/login', credentials),
    // The response carries only the user — the credential itself arrived as a cookie the
    // browser has already stored and will attach from here on.
    onSuccess: (data) => {
      setUser(data.user);
      router.replace('/dashboard');
    },
  });
}

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => api.post<void>('/api/auth/logout'),
    // `onSettled`, not `onSuccess`: if the network call fails the user still asked to
    // be signed out, and the local session must go either way.
    onSettled: () => {
      clearSession();
      // Patient records are the previous user's data — leaving them in the cache would
      // let the next person to sign in on this machine see them.
      queryClient.clear();
      router.replace('/login');
    },
  });
}
