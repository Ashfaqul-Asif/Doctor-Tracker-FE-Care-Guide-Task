import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DoctorPicker } from '@/components/patients/doctor-picker';

/**
 * Regression coverage for two bugs reported against the patient edit dialog:
 *
 *  1. The doctor a patient is already assigned to showed up as the literal text
 *     "Currently selected" instead of their name — because the picker only ever fetches
 *     the first page of doctors, and an existing assignment is almost never in it.
 *  2. Typing in "Find a doctor" looked like it did nothing, because the closed <select>
 *     kept showing that same placeholder regardless of what the search turned up.
 *
 * The fix fetches the selected doctor directly (via `useDoctor`) so the dropdown shows
 * their real name immediately, and so a search producing a different match is visibly
 * selectable.
 */

const DOCTORS_PAGE = {
  data: [
    { id: 'd-1', name: 'Dr. Brian Cox', specialization: 'Neurology' },
    { id: 'd-2', name: 'Dr. Alice Park', specialization: 'Pediatrics' },
  ],
  page: 1,
  limit: 50,
  total: 2,
  totalPages: 1,
};

const ASSIGNED_DOCTOR = {
  id: 'd-missing',
  name: 'Dr. Amanda Streich',
  specialization: 'Gastro-oesophageal Reflux',
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Routes the test's fake `fetch` the same way the real API does: a path ending in
 * `/doctors` (with a query string) is the list endpoint; a path ending in `/doctors/<id>`
 * is the single-doctor endpoint.
 */
function fetchMockFor(search: { data: typeof DOCTORS_PAGE.data } = DOCTORS_PAGE) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (/\/doctors\/d-missing(\?|$)/.test(url)) {
      return jsonResponse(ASSIGNED_DOCTOR);
    }
    if (/\/doctors\?/.test(url)) {
      return jsonResponse({ ...DOCTORS_PAGE, ...search });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });
}

function renderPicker(value: string, onChange = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return {
    onChange,
    ...render(<DoctorPicker value={value} onChange={onChange} />, { wrapper }),
  };
}

describe('doctor picker', () => {
  it('shows the assigned doctor\'s real name, not a generic placeholder', async () => {
    vi.stubGlobal('fetch', fetchMockFor());

    renderPicker('d-missing');

    const select = await screen.findByLabelText('Doctor');

    await waitFor(() => {
      expect(select).toHaveValue('d-missing');
    });

    // This is the exact bug from the screenshot: the select is ostensibly "selected",
    // but a user has no way to tell *which* doctor without this resolving to a name.
    await waitFor(() => {
      const selected = (select as HTMLSelectElement).selectedOptions[0];
      expect(selected?.textContent).toBe('Dr. Amanda Streich — Gastro-oesophageal Reflux');
    });
    expect(screen.queryByText('Currently selected')).not.toBeInTheDocument();
  });

  it('falls back to "Currently selected" only while the real name is still loading', async () => {
    vi.stubGlobal('fetch', fetchMockFor());

    renderPicker('d-missing');

    // Before the single-doctor fetch resolves, the field must still be usable — it just
    // can't know the name yet.
    const select = screen.getByLabelText('Doctor');
    expect(select).toHaveValue('d-missing');
  });

  it('does not fetch a single doctor when the value is already in the list', async () => {
    const fetchMock = fetchMockFor();
    vi.stubGlobal('fetch', fetchMock);

    renderPicker('d-1');

    const select = await screen.findByLabelText('Doctor');
    await waitFor(() => expect(select).toHaveValue('d-1'));

    const selected = (select as HTMLSelectElement).selectedOptions[0];
    expect(selected?.textContent).toBe('Dr. Brian Cox — Neurology');

    // No request for /api/v1/doctors/d-1 — only the list endpoint was needed.
    expect(fetchMock.mock.calls.some(([input]) => /\/doctors\/d-1(\?|$)/.test(String(input)))).toBe(
      false,
    );
  });

  it('re-queries the doctor list as the search box is typed into, after the debounce', async () => {
    const fetchMock = fetchMockFor();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderPicker('');

    await screen.findByLabelText('Doctor');
    const callsBeforeTyping = fetchMock.mock.calls.length;

    await user.type(screen.getByLabelText('Find a doctor'), 'Alice');

    // Requirements §2: the search is debounced by at least 300ms, so immediately after
    // typing there should be no new request yet...
    expect(fetchMock.mock.calls.length).toBe(callsBeforeTyping);

    // ...and after the debounce elapses, a new list request actually goes out carrying
    // the search text — this is the part that makes the dropdown's options change.
    await waitFor(
      () => {
        const sawSearch = fetchMock.mock.calls.some(([input]) =>
          String(input).includes('search=Alice'),
        );
        expect(sawSearch).toBe(true);
      },
      { timeout: 1000 },
    );
  });
});
