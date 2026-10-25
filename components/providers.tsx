'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { ApiError, restoreSession } from '@/lib/api';

/**
 * Restores a session after a hard refresh.
 *
 * The session cookie survived the reload, but it is httpOnly — so the client cannot read
 * it and has to ask the API who it belongs to. One `GET /api/auth/me` on mount moves the
 * auth store off `loading`.
 *
 * Next's middleware can't do this: the cookie belongs to the API's origin, so middleware
 * running on the client's origin cannot see it.
 */
function AuthBootstrap() {
  useEffect(() => {
    void restoreSession();
  }, []);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // A 400 or a 404 will fail identically the second time; only retry
              // failures that plausibly resolve themselves.
              if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                return false;
              }
              return failureCount < 2;
            },
          },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      {children}
    </QueryClientProvider>
  );
}
