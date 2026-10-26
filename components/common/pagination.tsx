'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { memo, useMemo } from 'react';
import type { Paginated } from '@/lib/types';
import { cn } from '@/lib/utils';
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
 * Build a short, windowed list of pages to show:
 *   [1, …, 4, 5, 6, …, 20]
 * The current page is always flanked by one neighbour on each side, with ellipses where
 * the sequence skips. Returns numbers for pages and the string "…" for gaps — a tagged
 * union would be noisier for one call site.
 */
function windowedPages(page: number, totalPages: number): Array<number | '…'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const window = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  // Also show the first two and last two so a reader always sees where the ends are.
  window.add(2);
  window.add(totalPages - 1);

  const sorted = [...window].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const out: Array<number | '…'> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const current = sorted[i]!;
    const previous = sorted[i - 1];
    if (previous !== undefined && current - previous > 1) {
      out.push('…');
    }
    out.push(current);
  }
  return out;
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

  const pages = useMemo(() => windowedPages(page, totalPages), [page, totalPages]);

  if (total === 0) return null;

  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5"
    >
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Showing <span className="font-medium text-foreground">{first}</span>–
        <span className="font-medium text-foreground">{last}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span> {noun}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="rounded-full"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>

        {/* Numeric page chips: hidden on narrow screens to keep this row single-line. */}
        <ul className="hidden items-center gap-1 sm:flex">
          {pages.map((entry, index) =>
            entry === '…' ? (
              <li
                key={`ellipsis-${index}`}
                aria-hidden="true"
                className="px-1 text-xs text-muted-foreground"
              >
                …
              </li>
            ) : (
              <li key={entry}>
                <button
                  type="button"
                  onClick={() => onPageChange(entry)}
                  aria-current={entry === page ? 'page' : undefined}
                  aria-label={`Page ${entry}`}
                  className={cn(
                    'inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-medium transition-colors',
                    entry === page
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {entry}
                </button>
              </li>
            ),
          )}
        </ul>

        {/* Compact label for narrow screens, where the chip row is hidden. */}
        <span className="px-2 text-xs text-muted-foreground sm:hidden">
          Page {page} of {totalPages}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="rounded-full"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
});
