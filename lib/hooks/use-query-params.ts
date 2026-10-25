'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

/**
 * Filters, search and pagination live in the URL rather than component state.
 *
 * That makes a filtered view shareable, makes the browser's back button behave the way
 * users expect, and means a refresh doesn't silently reset what someone was looking at.
 */
export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => Object.fromEntries(searchParams.entries()) as Record<string, string>,
    [searchParams],
  );

  const setParams = useCallback(
    (updates: Record<string, string | number | undefined | null>, options?: { resetPage?: boolean }) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null || value === '') next.delete(key);
        else next.set(key, String(value));
      }

      // Changing a filter while on page 7 of the old result set strands the user on an
      // empty page, so any filter change sends them back to the first one.
      if (options?.resetPage !== false && !('page' in updates)) next.delete('page');

      // `replace` rather than `push`: typing in a search box shouldn't bury the
      // previous page under a dozen history entries.
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const clearParams = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return { params, setParams, clearParams };
}

export function numberParam(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
