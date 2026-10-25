'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const controlStyles =
  'h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive';

/** Internal to this module: every label in the app is rendered through `Field`. */
function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn('text-sm font-medium text-foreground', className)}
      {...props}
    />
  );
}

interface FieldProps {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

/**
 * Wires a label, hint and error message to a control by id.
 *
 * Doing this in one place is what keeps `aria-describedby` and `aria-invalid` correct
 * on every form in the app — a screen reader user hears the validation message, not
 * just a field that mysteriously refuses to submit.
 */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children({ id, describedBy: describedBy || undefined, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlStyles, className)} {...props} />;
}

/**
 * A native `<select>`, deliberately.
 *
 * A custom listbox would need to reimplement type-ahead, keyboard navigation and the
 * platform picker that mobile browsers give for free — and get all three right. For
 * filter dropdowns there is nothing to gain by trying.
 */
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlStyles, 'cursor-pointer pr-8', className)} {...props}>
      {children}
    </select>
  );
}
