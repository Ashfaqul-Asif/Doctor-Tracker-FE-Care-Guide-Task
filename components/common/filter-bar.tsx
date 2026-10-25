'use client';

import { Search, X } from 'lucide-react';
import { memo, useId, type ReactNode } from 'react';
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
    <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-end">
      <div className="min-w-0 flex-1 space-y-1.5">
        <label htmlFor={searchId} className="text-sm font-medium text-foreground">
          {searchLabel}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={searchId}
            type="search"
            className="pl-9"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      {children}

      {hasFilters ? (
        <Button variant="ghost" size="sm" onClick={onClear} className="self-start lg:self-end">
          <X className="h-4 w-4" aria-hidden="true" />
          Clear
        </Button>
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
    <div className="space-y-1.5 lg:w-48">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <Select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
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
    <div className="flex gap-2">
      <div className="space-y-1.5">
        <label htmlFor={fromId} className="text-sm font-medium text-foreground">
          Added from
        </label>
        <Input
          id={fromId}
          type="date"
          value={from}
          max={to || undefined}
          onChange={(event) => onChange({ from: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        {/*
          Visually "to" reads as a continuation of "Added from" beside it, but the
          accessible name is announced on its own — "to" alone says nothing about what
          the field is for. The full name is hidden rather than dropped.
        */}
        <label htmlFor={toId} className="text-sm font-medium text-foreground">
          <span aria-hidden="true">to</span>
          <span className="sr-only">Added up to</span>
        </label>
        <Input
          id={toId}
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => onChange({ to: event.target.value })}
        />
      </div>
    </div>
  );
}
