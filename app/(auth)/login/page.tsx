'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiError } from '@/lib/api';
import { useLogin } from '@/lib/hooks/use-auth';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">Doctor Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to continue</p>
        </div>

        <Card className="p-5">
          <form
            noValidate
            onSubmit={handleSubmit((values) => login.mutate(values))}
            className="space-y-4"
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
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  {...register('password')}
                />
              )}
            </Field>

            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
