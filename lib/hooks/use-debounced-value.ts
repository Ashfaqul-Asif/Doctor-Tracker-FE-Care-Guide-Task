'use client';

import { useEffect, useState } from 'react';

/**
 * Requirements §2: search input is debounced by at least 300ms.
 *
 * Without this, every keystroke is a request *and* a re-render of the whole table —
 * which is precisely the "unnecessary re-renders on list/filter interactions" the
 * non-functional requirements call out.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
