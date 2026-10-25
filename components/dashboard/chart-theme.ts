import type { CSSProperties } from 'react';

/**
 * Shared Recharts presentation, hoisted to module scope.
 *
 * Both charts previously declared this object inline, which rebuilt it on every render
 * and handed Recharts a prop that never compared equal — and meant two copies of the
 * same theming decision to keep in step.
 */
export const TOOLTIP_STYLE: CSSProperties = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--color-foreground)',
};
