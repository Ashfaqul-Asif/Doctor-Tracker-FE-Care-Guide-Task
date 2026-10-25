'use client';

import { memo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Rendered as the card title on mobile instead of a labelled field. */
  primary?: boolean;
  /** Hidden on the mobile card view — for low-value columns. */
  hideOnMobile?: boolean;
  className?: string;
}

interface ResponsiveTableProps<T> {
  caption: string;
  columns: Array<Column<T>>;
  rows: T[];
  getRowKey: (row: T) => string;
  actions?: (row: T) => ReactNode;
}

/**
 * One data set, two presentations.
 *
 * Below `md` a table either scrolls sideways or gets squeezed into unreadable columns,
 * so rows are re-rendered as cards. It is deliberately not one `<table>` restyled with
 * `display: block` — that drops the implicit table semantics and leaves screen-reader
 * users with a pile of unlabelled text. Two markup paths, both correct.
 *
 * Both trees are always in the DOM; the breakpoint classes hide one with `display: none`,
 * which assistive tech honours, so only the active presentation is ever announced. The
 * cost is duplicated nodes for a page of rows, which at these page sizes is cheaper than
 * a JS media query and the hydration mismatch that comes with it.
 */
function ResponsiveTableInner<T>({
  caption,
  columns,
  rows,
  getRowKey,
  actions,
}: ResponsiveTableProps<T>) {
  return (
    <>
      {/* Desktop / tablet */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-border text-left">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
              {actions ? (
                <th scope="col" className="px-4 py-2.5 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="border-b border-border last:border-0 hover:bg-accent/50">
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-4 py-3 align-middle', column.className)}>
                    {column.cell(row)}
                  </td>
                ))}
                {actions ? (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">{actions(row)}</div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <ul className="divide-y divide-border md:hidden" aria-label={caption}>
        {rows.map((row) => {
          const primary = columns.find((column) => column.primary);
          const rest = columns.filter((column) => !column.primary && !column.hideOnMobile);

          return (
            <li key={getRowKey(row)} className="space-y-2 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 text-sm font-medium text-foreground">
                  {primary ? primary.cell(row) : null}
                </div>
                {actions ? <div className="flex shrink-0 gap-1">{actions(row)}</div> : null}
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {rest.map((column) => (
                  <div key={column.key} className="min-w-0">
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {column.header}
                    </dt>
                    <dd className="truncate text-sm text-foreground">{column.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/**
 * Memoised: typing in the debounced search box re-renders the page on every keystroke,
 * and without this the whole table re-renders with it even though `rows` is unchanged.
 *
 * That only holds if call sites pass stable props. `memo` compares by identity, so a
 * `getRowKey={(row) => row.id}` or `actions={(row) => …}` written inline allocates a new
 * function every render and defeats the comparison entirely — leaving the wrapper as
 * pure overhead plus a comment claiming an optimisation that never happens. Every call
 * site therefore hoists `columns` and `getRowKey` to module constants and wraps
 * `actions` in `useCallback`.
 */
export const ResponsiveTable = memo(ResponsiveTableInner) as typeof ResponsiveTableInner;
