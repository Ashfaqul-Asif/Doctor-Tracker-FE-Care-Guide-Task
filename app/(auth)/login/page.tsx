'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Activity, ShieldCheck, Stethoscope, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiError } from '@/lib/api';
import { useLogin } from '@/lib/hooks/use-auth';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { FormError } from '@/components/ui/form-error';

/**
 * Client-side validation here is purely for feedback speed — the API validates the
 * same payload again and is the actual source of truth (requirements §2).
 */
const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

type LoginValues = z.infer<typeof loginSchema>;

const HIGHLIGHTS = [
  { icon: Stethoscope, text: 'Track every doctor and their patient roster in one place' },
  { icon: Users, text: 'Fast search and filters across thousands of patient records' },
  { icon: ShieldCheck, text: 'Session-based auth — nothing sensitive ever touches the client' },
] as const;

export default function LoginPage() {
  const status = useAuthStore((state) => state.status);
  const router = useRouter();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    // Someone who still has a live session shouldn't be looking at a login form.
    if (status === 'authenticated') router.replace('/dashboard');
  }, [status, router]);

  const serverError = login.error;
  const rateLimited = serverError instanceof ApiError && serverError.status === 429;

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel — hidden on small screens, where the form alone fills the page. */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden px-10 py-12 text-primary-foreground lg:flex"
        style={{ backgroundImage: 'var(--primary-gradient)' }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at 85% 75%, rgba(255,255,255,0.18), transparent 45%)',
          }}
        />

        <div className="relative flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-wide">Doctor Tracker</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">
            Every doctor and patient, organized in one dashboard.
          </h1>
          <p className="mt-3 text-sm text-primary-foreground/80">
            Sign in to pick up right where you left off — rosters, charts and records stay in
            sync the moment you land.
          </p>

          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-primary-foreground/90">
                <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-md bg-white/15">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Doctor Tracker. All data stays on your own backend.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md text-primary-foreground"
              style={{ backgroundImage: 'var(--primary-gradient)' }}
            >
              <Activity className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-foreground">Doctor Tracker</span>
          </div>

          <h2 className="text-2xl font-semibold text-foreground">Welcome back</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your credentials to access your dashboard.
          </p>

          <form
            noValidate
            onSubmit={handleSubmit((values) => login.mutate(values))}
            className="mt-8 space-y-4"
          >
            <FormError
              message={
                serverError
                  ? rateLimited
                    ? 'Too many attempts. Please wait a few minutes and try again.'
                    : serverError instanceof Error
                      ? serverError.message
                      : 'Sign in failed.'
                  : null
              }
            />

            <Field label="Email" error={errors.email?.message}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@example.com"
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  {...register('email')}
                />
              )}
            </Field>

            <Field label="Password" error={errors.password?.message}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  {...register('password')}
                />
              )}
            </Field>

            <Button type="submit" className="w-full" size="md" disabled={login.isPending}>
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Access is provisioned by your administrator — there is no self-serve sign-up.
          </p>
        </div>
      </div>
    </main>
  );
}
