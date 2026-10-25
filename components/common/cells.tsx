import type { ReactNode } from 'react';
import { formatDate } from '@/lib/utils';

/**
 * Cell renderers shared across tables.
 *
 * These are one-liners, which is exactly why they are worth sharing: the same muted
 * `createdAt` cell appeared in three column definitions, and three copies of a styling
 * decision is three places to forget when it changes.
 */

export function DateCell({ iso }: { iso: string }): ReactNode {
  return <span className="text-muted-foreground">{formatDate(iso)}</span>;
}

/** An em-dash placeholder, for a column whose value is legitimately absent. */
export function EmptyCell(): ReactNode {
  return <span className="text-muted-foreground">—</span>;
}
