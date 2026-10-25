import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DoctorsPage from '@/app/(dashboard)/doctors/page';
import { useAuthStore } from '@/lib/stores/auth-store';

/**
 * The critical path on the busiest screen: typing in the search box must debounce, then
 * push the term into the URL — which is what actually drives the query. Asserting on the
 * outgoing request rather than on rendered rows is what makes this a test of the
 * behaviour instead of a test of the fixture.
 */

const replace = vi.fn();
let currentParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/doctors',
  useSearchParams: () => currentParams,
  useParams: () => ({}),
}));

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const EMPTY_PAGE = { data: [], page: 1, limit: 20, total: 0, totalPages: 0 };

const DOCTOR = {
  id: 'd1',
  name: 'Alice Nguyen',
  specialization: 'Cardiology',
  hospital: 'St. Mary General',
  phone: '+1-555-0100',
  email: 'alice@hospital.test',
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return render(<DoctorsPage />, { wrapper });
}

beforeEach(() => {
  replace.mockClear();
  currentParams = new URLSearchParams();
  useAuthStore.setState({
    user: { id: 'u1', email: 'admin@careguide.test', role: 'admin' },
    status: 'authenticated',
  });
});

describe('doctors page', () => {
  it('renders the rows the API returns', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) =>
        input.includes('/facets')
          ? jsonResponse({ specializations: ['Cardiology'], hospitals: ['St. Mary General'] })
          : jsonResponse({ ...EMPTY_PAGE, data: [DOCTOR], total: 1, totalPages: 1 }),
      ),
    );

    renderPage();

    // `ResponsiveTable` renders a desktop table *and* a mobile card list, with CSS
    // hiding one. A browser hides the inactive one from assistive tech too, but there
    // is no CSS here — so the query is scoped to the table to avoid matching both.
    const table = await screen.findByRole('table', { name: 'Doctors' });
    expect(within(table).getByRole('link', { name: 'Alice Nguyen' })).toBeInTheDocument();
    expect(within(table).getByText('Cardiology')).toBeInTheDocument();
    expect(screen.getByText('Showing', { exact: false })).toBeInTheDocument();
  });

  it('shows an empty state rather than a blank table', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) =>
        input.includes('/facets')
          ? jsonResponse({ specializations: [], hospitals: [] })
          : jsonResponse(EMPTY_PAGE),
      ),
    );

    renderPage();

    expect(await screen.findByText('No doctors yet')).toBeInTheDocument();
  });

  it('debounces the search box before putting the term in the URL', async () => {
    const requestedUrls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        requestedUrls.push(input);
        return input.includes('/facets')
          ? jsonResponse({ specializations: [], hospitals: [] })
          : jsonResponse(EMPTY_PAGE);
      }),
    );

    const user = userEvent.setup();
    renderPage();

    await screen.findByLabelText('Search by name');
    requestedUrls.length = 0;

    await user.type(screen.getByLabelText('Search by name'), 'ali');

    // Mid-typing: nothing has been committed to the URL yet.
    expect(replace).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/doctors?search=ali', { scroll: false });
    });

    // Three keystrokes produced one URL update, not three.
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it('surfaces a failed request as an error state with a retry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) =>
        input.includes('/facets')
          ? jsonResponse({ specializations: [], hospitals: [] })
          : new Response(
              JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Database is down' } }),
              { status: 500, headers: { 'Content-Type': 'application/json' } },
            ),
      ),
    );

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Database is down');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
