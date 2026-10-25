import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DoctorForm } from '@/components/doctors/doctor-form';
import { useAuthStore } from '@/lib/stores/auth-store';

/**
 * The trickiest logic in the UI is not the happy path — it is what happens when the
 * server disagrees. These cover the two branches that had no coverage and no visible
 * failure mode when broken: mapping the API's field errors back onto the right inputs,
 * and what the form does with a field error it cannot place.
 */

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/doctors',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return render(<DoctorForm open onOpenChange={vi.fn()} />, { wrapper });
}

async function fillValidDoctor(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Full name'), 'Alice Nguyen');
  await user.type(screen.getByLabelText('Specialization'), 'Cardiology');
  await user.type(screen.getByLabelText('Hospital'), 'St. Mary General');
  await user.type(screen.getByLabelText('Phone'), '+1-555-0100');
  await user.type(screen.getByLabelText('Email'), 'alice@hospital.test');
}

function errorResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  replace.mockClear();
  useAuthStore.setState({
    user: { id: 'u1', email: 'admin@careguide.test', role: 'admin' },
    status: 'authenticated',
  });
});

describe('doctor form', () => {
  it('blocks submission on client-side validation and never calls the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Add doctor' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    // The point of validating client-side is to not spend a round trip finding this out.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('attaches a server field error to that field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        errorResponse(400, {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: [{ field: 'email', message: 'That email is already on the roster' }],
          },
        }),
      ),
    );

    const user = userEvent.setup();
    renderForm();

    await fillValidDoctor(user);
    await user.click(screen.getByRole('button', { name: 'Add doctor' }));

    // Rendered against the email input, not dumped into an anonymous banner — so the
    // user is looking at the field they have to change.
    const message = await screen.findByText('That email is already on the roster');
    expect(message).toBeInTheDocument();

    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(emailInput.getAttribute('aria-describedby')).toBe(message.id);
  });

  it('falls back to the banner for a field error it cannot place', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        errorResponse(400, {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: [{ field: 'licenceNumber', message: 'Unknown field' }],
          },
        }),
      ),
    );

    const user = userEvent.setup();
    renderForm();

    await fillValidDoctor(user);
    await user.click(screen.getByRole('button', { name: 'Add doctor' }));

    // This form has no `licenceNumber` input. Without the fallback the error would be
    // stored by react-hook-form, rendered by nothing, and the submit would appear to do
    // nothing at all.
    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent('Request validation failed');
  });

  it('shows a non-validation failure in the banner', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        errorResponse(409, {
          error: { code: 'DUPLICATE_KEY', message: 'A record with that email already exists' },
        }),
      ),
    );

    const user = userEvent.setup();
    renderForm();

    await fillValidDoctor(user);
    await user.click(screen.getByRole('button', { name: 'Add doctor' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A record with that email already exists',
    );
  });

  it('closes on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ id: 'd1', name: 'Alice Nguyen' }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );

    const onOpenChange = vi.fn();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const user = userEvent.setup();

    render(<DoctorForm open onOpenChange={onOpenChange} />, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await fillValidDoctor(user);
    await user.click(screen.getByRole('button', { name: 'Add doctor' }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
