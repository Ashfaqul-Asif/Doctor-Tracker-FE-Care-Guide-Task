import { useAuthStore } from '@/lib/stores/auth-store';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

/**
 * Every endpoint lives under the backend's versioned prefix (the server's API_PREFIX,
 * default `/api/v1`). Callers still pass plain `/api/...` paths; buildUrl rewrites the
 * leading `/api` to this prefix so a single place controls the version. Override with
 * NEXT_PUBLIC_API_PREFIX if the backend ever changes it.
 */
const API_PREFIX = (process.env.NEXT_PUBLIC_API_PREFIX ?? '/api/v1').replace(/\/+$/, '');

export interface FieldError {
  field: string;
  message: string;
}

/** The API's error envelope, normalised into something throwable. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: FieldError[];

  constructor(status: number, code: string, message: string, details: FieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** True when the failure is the user's input rather than the system's fault. */
  get isValidation(): boolean {
    return this.status === 400 && this.details.length > 0;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as {
      error?: { code?: string; message?: string; details?: FieldError[] };
    };
    return new ApiError(
      response.status,
      body.error?.code ?? 'UNKNOWN',
      body.error?.message ?? response.statusText,
      body.error?.details ?? [],
    );
  } catch {
    // A gateway timeout or a dead server returns HTML, not our envelope.
    return new ApiError(response.status, 'NETWORK', response.statusText || 'Request failed');
  }
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: QueryParams;
  signal?: AbortSignal;
}

function buildUrl(path: string, params?: QueryParams): string {
  // Rewrite the leading `/api` to the versioned prefix, e.g. /api/auth/login →
  // /api/v1/auth/login, so every call matches the backend's API_PREFIX.
  const versionedPath = path.replace(/^\/api(?=\/|$)/, API_PREFIX);
  const url = new URL(versionedPath, API_BASE_URL);
  for (const [key, value] of Object.entries(params ?? {})) {
    // Empty filters must be absent, not sent as `?search=` — the API validates a
    // present-but-empty string as invalid rather than treating it as "no filter".
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/**
 * There is no Authorization header and no token to attach.
 *
 * The session lives in an httpOnly cookie, which the browser sends automatically given
 * `credentials: 'include'`. That deletes an entire category of client code: no token in
 * memory, no refresh-on-401 retry, and no single-flight guard to stop concurrent 401s
 * from stampeding a refresh endpoint. The cookie is either valid or it is not.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.params), {
      method: options.method ?? 'GET',
      // Sends the session cookie; also why the API's CORS allowlist cannot be `*`.
      credentials: 'include',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    // A cancelled query is not a failure — TanStack Query aborts in-flight requests on
    // unmount and relies on the AbortError reaching it unchanged.
    if (error instanceof DOMException && error.name === 'AbortError') throw error;

    // `fetch` rejects only on network-level failures: API down, DNS, blocked preflight.
    // Left unwrapped this surfaces as the browser's bare "Failed to fetch", which tells
    // a user nothing and bypasses every `instanceof ApiError` branch in the UI.
    throw new ApiError(
      0,
      'NETWORK',
      `Could not reach the API at ${API_BASE_URL}. Check that it is running.`,
    );
  }

  // The session is gone — expired, revoked, or signed out in another tab. Drop the local
  // identity so the route guard redirects, rather than leaving the UI claiming to be
  // signed in while every request fails. `/api/auth/*` is excluded: a failed login is a
  // wrong password, not a lost session.
  if (response.status === 401 && !path.startsWith('/api/auth/')) {
    useAuthStore.getState().clearSession();
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, params?: QueryParams, signal?: AbortSignal) =>
    request<T>(path, { method: 'GET', params, signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/**
 * Restores the session on a fresh page load.
 *
 * The cookie is httpOnly, so the client cannot inspect it to find out whether it is
 * signed in — it has to ask. This is that question, and its answer is what moves the
 * auth store off `loading`.
 */
export async function restoreSession(): Promise<boolean> {
  try {
    const { user } = await api.get<{ user: import('@/lib/types').AuthUser }>('/api/auth/me');
    useAuthStore.getState().setUser(user);
    return true;
  } catch {
    useAuthStore.getState().clearSession();
    return false;
  }
}
