import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AuthUser } from '@/lib/types';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
}

/**
 * Who is signed in — and nothing else.
 *
 * There is deliberately no token here. The session credential is an httpOnly cookie the
 * browser attaches on its own, so JavaScript never sees it and has nothing to store: no
 * token in memory to lose on reload, and nothing for an XSS payload to read. This store
 * holds identity for rendering, not a credential.
 *
 * `status` starts at 'loading' so the dashboard layout can tell "not signed in" apart
 * from "we haven't asked yet" — without that distinction every hard refresh flashes the
 * login page before `GET /api/auth/me` answers.
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      status: 'loading',

      setUser: (user) => set({ user, status: 'authenticated' }, false, 'auth/setUser'),

      clearSession: () => set({ user: null, status: 'anonymous' }, false, 'auth/clearSession'),
    }),
    { name: 'auth', enabled: process.env.NODE_ENV === 'development' },
  ),
);
