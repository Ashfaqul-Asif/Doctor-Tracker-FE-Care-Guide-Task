'use client';

import { AlertCircle, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/card';

/**
 * Requirements §2 and DoD #1: every request has a loading, empty and error state.
 * Sharing these three components is what makes honouring that cheap enough that no
 * screen quietly skips one.
 */

/** Internal: consumers want `LoadingRegion`, which announces itself to screen readers. */
function TableSkeleton({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2 p-4" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3">
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <Skeleton key={columnIndex} className="h-9 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function LoadingRegion({ label = 'Loading' }: { label?: string }) {
  // The visual skeleton says nothing to a screen reader; this does.
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <TableSkeleton />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Something went wrong.';

  const isOffline =
    error instanceof ApiError && (error.code === 'NETWORK' || error.status === 0);

  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">Could not load this data</p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {isOffline ? (
        <p className="text-xs text-muted-foreground">
          Check that the API is running on {process.env.NEXT_PUBLIC_API_BASE_URL ?? 'localhost:4000'}.
        </p>
      ) : null}
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
