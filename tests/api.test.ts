import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, restoreSession } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth-store';

/**
 * The transport layer's contract.
 *
 * The session credential is an httpOnly cookie, so there is no token for this layer to
 * attach or refresh — the interesting behaviour is that every request opts into sending
 * cookies, and that a 401 drops the local identity rather than leaving the UI insisting
 * it is signed in while nothing works.
 */

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(status: number, code: string): Response {
  return jsonResponse({ error: { code, message: `${code} happened` } }, status);
}

const USER = { id: 'u1', email: 'admin@careguide.test', role: 'admin' as const };

beforeEach(() => {
  useAuthStore.setState({ user: USER, status: 'authenticated' });
});

describe('api request', () => {
  it('sends cookies and attaches no Authorization header', async () => {
    // Parameters are declared so `mock.calls` is typed — otherwise the recorded tuple
    // infers as empty and reading it needs a cast.
    const fetchMock = vi.fn(async (_input: string, _init: RequestInit) =>
      jsonResponse({ ok: true }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await api.get('/api/doctors');

    const [, init] = fetchMock.mock.calls[0]!;
    // The session cookie is httpOnly and cross-origin; without this it is never sent.
    expect(init.credentials).toBe('include');
    // There is no token in JavaScript to attach, by design.
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('omits empty filters from the query string', async () => {
    const fetchMock = vi.fn(async (_input: string, _init: RequestInit) =>
      jsonResponse({ ok: true }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await api.get('/api/doctors', { page: 1, search: '', specialization: undefined });

    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toContain('page=1');
    // `?search=` is not "no filter" to the API — it is an invalid empty string.
    expect(url).not.toContain('search=');
    expect(url).not.toContain('specialization=');
  });

  it('normalises an unreachable API into a NETWORK ApiError', async () => {
    // What `fetch` actually throws when the server is down.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );

    await expect(api.get('/api/doctors')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'NETWORK',
      status: 0,
    });
  });

  it('lets an AbortError through untouched', async () => {
    // TanStack Query cancels in-flight requests on unmount and depends on recognising
    // this; wrapping it would turn a routine cancellation into a rendered error.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new DOMException('Aborted', 'AbortError'))),
    );

    await expect(api.get('/api/doctors')).rejects.toBeInstanceOf(DOMException);
  });

  it('turns the error envelope into an ApiError with field details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Request validation failed',
              details: [{ field: 'email', message: 'A valid email address is required' }],
            },
          },
          400,
        ),
      ),
    );

    const error = await api.post('/api/doctors', {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isValidation).toBe(true);
    expect((error as ApiError).details[0]?.field).toBe('email');
  });

  it('returns undefined for a 204 rather than trying to parse a body', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 204 })));

    await expect(api.delete('/api/patients/p1')).resolves.toBeUndefined();
  });
});

describe('session loss', () => {
  it('clears the local identity when a request 401s', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => errorResponse(401, 'INVALID_SESSION')));

    await expect(api.get('/api/doctors')).rejects.toBeInstanceOf(ApiError);

    // Without this the route guard never fires and the UI keeps claiming to be signed
    // in while every request fails.
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('does not clear the session when a login attempt 401s', async () => {
    useAuthStore.setState({ user: null, status: 'anonymous' });
    vi.stubGlobal('fetch', vi.fn(async () => errorResponse(401, 'INVALID_CREDENTIALS')));

    await expect(
      api.post('/api/auth/login', { email: 'a@b.test', password: 'wrong' }),
    ).rejects.toBeInstanceOf(ApiError);

    // A wrong password is not a lost session — the auth routes are excluded so a failed
    // sign-in cannot masquerade as one.
    expect(useAuthStore.getState().status).toBe('anonymous');
  });
});

describe('restoreSession', () => {
  it('adopts the user the cookie belongs to', async () => {
    useAuthStore.setState({ user: null, status: 'loading' });
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ user: USER })));

    await expect(restoreSession()).resolves.toBe(true);
    expect(useAuthStore.getState().user).toEqual(USER);
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('settles on anonymous when there is no live session', async () => {
    useAuthStore.setState({ user: null, status: 'loading' });
    vi.stubGlobal('fetch', vi.fn(async () => errorResponse(401, 'NO_SESSION')));

    await expect(restoreSession()).resolves.toBe(false);
    // Must leave `loading` either way, or the dashboard layout shows its placeholder
    // for ever instead of redirecting to the login page.
    expect(useAuthStore.getState().status).toBe('anonymous');
  });
});
