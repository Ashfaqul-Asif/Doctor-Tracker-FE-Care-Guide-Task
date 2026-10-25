'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryParams } from './use-query-params';

/**
 * A search box whose value lives in the URL, written on a delay.
 *
 * The input keeps its own state so typing stays instant; the URL — and therefore the
 * query — only follows once the value settles (requirements §2: debounce ≥ 300ms).
 *
 * The write happens in the change handler rather than in an effect that watches a
 * debounced value. Watching would mean re-rendering once for the settled value, again
 * for the URL change, and carrying a manual `!==` guard to stop the two from looping.
 * Scheduling the write directly is the same behaviour with none of that.
 */
export function useDebouncedSearchParam(delayMs = 300) {
  const { params, setParams, clearParams } = useQueryParams();

  const [value, setValue] = useState(params.search ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * `setParams` is rebuilt whenever the URL changes, so reading it through a ref is
   * what keeps `onChange` referentially stable. That stability is load-bearing: the
   * memoised `FilterBar` this handler is passed to compares props by identity, and a
   * fresh closure per render would defeat it.
   */
  const setParamsRef = useRef(setParams);
  const clearParamsRef = useRef(clearParams);
  useEffect(() => {
    setParamsRef.current = setParams;
    clearParamsRef.current = clearParams;
  }, [setParams, clearParams]);

  // A pending write must not land after the component is gone.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const onChange = useCallback(
    (next: string) => {
      setValue(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setParamsRef.current({ search: next || undefined });
      }, delayMs);
    },
    [delayMs],
  );

  /** Clears the box and every other filter with it, cancelling any scheduled write. */
  const clearAll = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setValue('');
    clearParamsRef.current();
  }, []);

  return { value, onChange, clearAll };
}
