'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { memo } from 'react';
import type { Paginated } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  /**
   * The API's list envelope, passed whole.
   *
   * Taking `meta` rather than `page`/`limit`/`total`/`totalPages` as four siblings: the
   * four always travel together and always come from the same response, so splitting
   * them at the call site only creates four chances to wire one to the wrong query.
   */
  meta: Paginated<unknown>;
  onPageChange: (page: number) => void;
  /** What is being counted, for the summary line. */
  noun?: string;
}

/**
 * Server-driven pagination (FR-8): this component only reports what the API said and
 * asks for another page. It never slices a list itself.
 *
 * Memoised, and the call sites hold up their end — `onPageChange` is a `useCallback`
 * everywhere it is passed. Without that this would re-render on every keystroke in the
 * search box and the `memo` would be pure overhead.
 */
export const Pagination = memo(function Pagination({
  meta,
  onPageChange,
  noun = 'results',
}: PaginationProps) {
  const { page, limit, total, totalPages } = meta;

  if (total === 0) return null;

  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3"
    >
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Showing <span className="font-medium text-foreground">{first}</span>–
        <span className="font-medium text-foreground">{last}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span> {noun}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
});
