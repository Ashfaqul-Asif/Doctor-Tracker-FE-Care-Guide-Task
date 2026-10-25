'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { AppShell } from '@/components/common/app-shell';

/**
 * The authentication gate.
 *
 * This runs on the client rather than in Next middleware on purpose: the refresh cookie
 * is httpOnly and scoped to the API's origin, so middleware executing on the client's
 * origin cannot read it and would have to guess. The access token itself only ever
 * exists in memory (FR-2), which leaves nothing for the server to inspect either.
 *
 * The `loading` status is what keeps this from flashing the login page on every hard
 * refresh while `AuthBootstrap` trades the cookie for a new access token.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const router = useRouter();

  useEffect(() => {
    if (status === 'anonymous') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
        <span className="text-sm text-muted-foreground">
          {status === 'loading' ? 'Restoring your session…' : 'Redirecting to sign in…'}
        </span>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
