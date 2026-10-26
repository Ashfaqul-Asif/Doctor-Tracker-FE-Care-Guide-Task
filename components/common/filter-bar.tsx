'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { memo, useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';

/**
 * Memoised because the search box re-renders its parent on every keystroke — this
 * subtree has no reason to follow it.
 *
 * Holds only if callers pass stable props: `onSearchChange` and `onClear` come from
 * `useDebouncedSearchParam`, which returns `useCallback`-wrapped handlers for exactly
 * this reason. `children` is a JSX subtree and so is always a fresh object — a page
 * whose filter controls change on every render will re-render this regardless, which is
 * the correct outcome, since those controls are its actual content.
 */
export const FilterBar = memo(function FilterBar({
  searchValue,
  onSearchChange,
  searchLabel,
  searchPlaceholder,
  onClear,
  hasFilters,
  children,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchLabel: string;
  searchPlaceholder: string;
  onClear: () => void;
  hasFilters: boolean;
  children?: ReactNode;
}) {
  // Generated, not hardcoded: a screen with two filter bars would otherwise emit two
  // elements with id="filter-search", and a duplicate id silently points every label at
  // whichever input the browser found first.
  const searchId = useId();

  return (
    <div className="border-b border-border bg-muted/30 px-4 py-3.5 sm:px-5">
      {/* Row 1: search pill + active-filters chip */}
      <div className="flex flex-wrap items-center gap-2.5">
        <label htmlFor={searchId} className="sr-only">
          {searchLabel}
        </label>
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={searchId}
            type="search"
            className={cn(
              'h-10 rounded-full border-transparent bg-card pl-10 pr-4 shadow-sm',
              'focus:border-ring focus:bg-card',
            )}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-10 shrink-0 rounded-full bg-card px-3 shadow-sm hover:bg-primary-soft hover:text-primary"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear filters
          </Button>
        ) : (
          // A quiet marker so the row doesn't collapse-expand as filters toggle. Mirrors
          // the "Filters" affordance you'd see in a modern table UI.
          <div
            aria-hidden="true"
            className="hidden h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground sm:inline-flex"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </div>
        )}
      </div>

      {/* Row 2: dropdown & date filters */}
      {children ? (
        <div className="mt-3 flex flex-wrap items-end gap-3">{children}</div>
      ) : null}
    </div>
  );
});

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allLabel: string;
}) {
  // Derived from the label, this collided whenever two selects shared a label — and
  // produced invalid ids for any label with punctuation in it.
  const id = useId();

  return (
    <div className="space-y-1 lg:w-48">
      <label htmlFor={id} className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <Select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'h-9 rounded-lg border-transparent bg-card text-sm shadow-sm',
          value ? 'text-foreground font-medium' : 'text-muted-foreground',
        )}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function DateRangeFilter({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (next: { from?: string; to?: string }) => void;
}) {
  const fromId = useId();
  const toId = useId();

  return (
    <div className="flex items-end gap-2">
      <div className="space-y-1">
        <label
          htmlFor={fromId}
          className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
        >
          Added from
        </label>
        <Input
          id={fromId}
          type="date"
          value={from}
          max={to || undefined}
          onChange={(event) => onChange({ from: event.target.value })}
          className="h-9 rounded-lg border-transparent bg-card shadow-sm"
        />
      </div>
      <div className="space-y-1">
        {/*
          Visually "to" reads as a continuation of "Added from" beside it, but the
          accessible name is announced on its own — "to" alone says nothing about what
          the field is for. The full name is hidden rather than dropped.
        */}
        <label
          htmlFor={toId}
          className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
        >
          <span aria-hidden="true">to</span>
          <span className="sr-only">Added up to</span>
        </label>
        <Input
          id={toId}
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => onChange({ to: event.target.value })}
          className="h-9 rounded-lg border-transparent bg-card shadow-sm"
        />
      </div>
    </div>
  );
}
