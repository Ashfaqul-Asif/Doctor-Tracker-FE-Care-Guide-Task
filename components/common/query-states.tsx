'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ErrorState, LoadingRegion } from './states';

interface QueryStatesProps<T> {
  query: UseQueryResult<T>;
  /** Announced to screen readers while the skeleton is on screen. */
  loadingLabel: string;
  /** Rendered instead of `children` when `isEmpty` says the result has nothing in it. */
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}

/**
 * The loading / error / empty / data ladder, in one place.
 *
 * Requirements §2 and DoD #1 ask every request to have all four. Writing the chain by
 * hand per screen is what makes one of them quietly go missing — and it is the *empty*
 * branch that goes, because it only shows up against data nobody has locally.
 *
 * A render prop rather than a `data` prop: `children` is only called once the query has
 * actually resolved, so the callback receives `T` and not `T | undefined`. Screens stop
 * carrying `?.` and `?? 0` for states this component has already excluded.
 */
export function QueryStates<T>({
  query,
  loadingLabel,
  empty,
  isEmpty,
  children,
}: QueryStatesProps<T>) {
  if (query.isPending) return <LoadingRegion label={loadingLabel} />;

  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  if (empty && isEmpty?.(query.data)) return <>{empty}</>;

  return <>{children(query.data)}</>;
}

/** `isEmpty` for anything using the API's `{ data, page, limit, total, totalPages }`. */
export function isEmptyPage(result: { data: unknown[] }): boolean {
  return result.data.length === 0;
}
