# Doctor Tracker — Frontend (`doctor_tracker_Fe`)

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4. An authenticated admin
dashboard for the doctors, patients and analytics served by the
[backend](../doctor_tracker_BE); the endpoint contract it codes against is
[docs/api.md](../docs/api.md).

This is a standalone npm package — it installs, tests, builds and deploys on its own, with
no workspace linking it to the backend. Run every command below from this directory.

---

## Setup

**Prerequisites:** Node 20.10+ (20.19+ recommended), npm 10+, and the API running.

```bash
cd doctor_tracker_Fe
cp .env.example .env.local
npm install
npm run dev      # http://localhost:3000
```

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Origin of the API. Defaults to `http://localhost:4000` |

`NEXT_PUBLIC_*` variables are **inlined into the browser bundle at build time** — they are
public by definition, so nothing secret belongs in this file. Changing it after a build
requires rebuilding, not just restarting.

Sign in with the credentials the API's `npm run seed` printed — by default
`admin@careguide.dev` / `Admin123!`. There is no sign-up screen: this is an internal admin
tool and user #1 comes from the [admin seeder](../doctor_tracker_BE/README.md#seeders).

> The API must be reachable before login will work, and its `CORS_ORIGINS` must list this
> app's exact origin — credentials are enabled on every request, so a wildcard is rejected
> by the browser rather than ignored.

---

## Routes

| Route | What it is |
|---|---|
| `/` | Redirects to `/dashboard` — there is no marketing surface |
| `/login` | Email + password, the only anonymous page |
| `/dashboard` | Totals, patients-per-doctor and registrations-over-time charts |
| `/doctors` | Server-paginated roster with per-word name search and a hospital filter |
| `/doctors/[id]` | One doctor, their details and their patients |
| `/patients` | Server-paginated patients with search, condition filter and soft delete |

Everything under `(dashboard)` is behind the auth gate in
[`app/(dashboard)/layout.tsx`](<app/(dashboard)/layout.tsx>).

**The route guard runs on the client, not in middleware.** The refresh cookie is httpOnly
and scoped to the API's origin, so Next middleware — which runs on *this* app's origin —
cannot see it, and the access token exists only in memory. The layout reads the auth
store's `status` instead, and renders "Restoring your session…" while `loading`, so a hard
refresh doesn't flash the login page before the session comes back.

---

## State ownership

Four kinds of state, four owners — deliberately no single global store:

| State | Owner |
|---|---|
| Server data (doctors, patients, dashboard) | **TanStack Query** — its cache *is* the store |
| Auth session (access token, user, status) | **Zustand** (`lib/stores/auth-store.ts`) |
| Ephemeral global UI (mobile nav) | **Zustand** (`lib/stores/ui-store.ts`) |
| Filters, search, pagination | **The URL** (`lib/hooks/use-query-params.ts`) |
| Form state | **React Hook Form** + zod resolver |

Server data is never mirrored into Zustand; two copies of a list is how a table ends up
displaying something the server disagrees with.

The auth store has **no `persist` middleware** — persisting the access token would put it
in localStorage, which FR-2 rules out. Zustand earns its place over Context because
`lib/api.ts` is a plain module, not a component: `useAuthStore.getState()` lets the fetch
wrapper read the token and clear the session outside React, with no provider plumbing.

Filters live in the URL so a filtered view is shareable and the back button behaves; any
filter change resets `page`, since changing a filter while on page 7 otherwise strands the
user on an empty result set.

---

## The API layer

Everything goes through [`lib/api.ts`](lib/api.ts), which is where four things are handled
once instead of at every call site:

- **The error envelope is normalised.** The API's `{ error: { code, message, details } }`
  becomes a throwable `ApiError`, with `isValidation` telling field-level failures apart
  from system ones so forms can map `details` onto inputs.
- **A dead API is not "Failed to fetch".** `fetch` rejects only on network-level failures;
  unwrapped that surfaces as the browser's bare message and bypasses every
  `instanceof ApiError` branch in the UI, so it is wrapped with the URL it tried.
- **Refresh is single-flight.** When a token expires every in-flight query 401s at once.
  A shared promise collapses those into one `/api/auth/refresh` — without it, token
  rotation would read the burst as reuse and revoke the whole session.
- **Empty filters are omitted, not sent empty.** `?search=` is a validation error on the
  API, not "no filter".

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next dev server on :3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (`eslint-config-next`) |
| `npm test` | Vitest + Testing Library |
| `npm run test:watch` | The same suite in watch mode |
| `npm run test:coverage` | With a v8 coverage report and thresholds |

---

## Layout

```
app/
  (auth)/login/          the only anonymous route
  (dashboard)/           layout.tsx is the auth gate
    dashboard/           summary cards + both charts
    doctors/             list · [id] detail
    patients/            list with soft delete
  error.tsx  global-error.tsx  layout.tsx  page.tsx
components/
  common/                app-shell · filter-bar · pagination · responsive-table
                         · query-states · confirm-dialog · row-actions · cells
  dashboard/             both charts · chart-theme · chart-data-table
  doctors/  patients/    forms, columns, pickers, dialogs
  ui/                    button · card · dialog · field · page-header · form-error
  providers.tsx          QueryClientProvider + AuthBootstrap
lib/
  api.ts                 fetch wrapper: auth header, refresh, error envelope
  query-keys.ts          one place every cache key is derived from
  types.ts               response shapes, mirrored from docs/api.md by hand
  hooks/                 use-auth · use-doctors · use-patients · use-dashboard
                         · use-query-params · use-debounced-value
  stores/                auth-store · ui-store
tests/                   Vitest + Testing Library
```

Conventions worth knowing before editing:

- **`@/*` resolves to this directory** (tsconfig path alias, mirrored in
  `vitest.config.mts`). Import `@/lib/api`, never `../../lib/api`.
- **Cache keys come from `lib/query-keys.ts`.** Hand-written key arrays are how a mutation
  ends up invalidating nothing.
- **Types are mirrored from the API by hand** in `lib/types.ts`. Nothing links the two
  packages, so the compiler cannot catch drift — [docs/api.md](../docs/api.md) is the
  contract both sides answer to. Change it there first.
- **Every list renders loading, empty and error states**, via `components/common/query-states.tsx`.
  A list that only handles the happy path is not finished.
- **Every chart ships a visually hidden data table** (`chart-data-table.tsx`) so the
  numbers reach screen readers. Recharts alone is not accessible.
- **Search inputs are debounced** (`use-debounced-search-param.ts`) — the filtering itself
  is the API's job, never the browser's.

---

## Tests

```bash
npm test
```

Vitest + Testing Library, no API required — `lib/api.ts` is mocked at the module boundary.
The suites cover the API layer's refresh and error handling, the doctor form's validation
and server-error mapping, the doctors page's loading/empty/error states and debounced
search, and pagination.

The environment is **happy-dom rather than jsdom**: jsdom 27 `require()`s an ESM-only CSS
dependency, which only works from Node 20.19, and this project's stated floor is 20.10.

```bash
npm run test:coverage
```

The thresholds in `vitest.config.mts` are a **ratchet against regression, not a target** —
set just under what the suite covers today so a drop fails the build. Raise them as
coverage grows; never lower them to make a build pass.

---

## Deployment

Vercel (or any Node host running `npm run build && npm start`). Set
`NEXT_PUBLIC_API_BASE_URL` to the API's public URL **before** the build — it is baked into
the bundle.

Once the two apps stop sharing a domain, two things change on the API side: `CORS_ORIGINS`
must list this app's exact origin, and the refresh cookie needs `COOKIE_SAMESITE=none`
with `COOKIE_SECURE=true`. Login working locally and failing in production is almost
always one of those two.
