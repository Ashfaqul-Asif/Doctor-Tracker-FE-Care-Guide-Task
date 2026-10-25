'use client';

import { useEffect } from 'react';

/**
 * The last resort, for a throw in the root layout itself.
 *
 * `app/error.tsx` renders *inside* the root layout, so it cannot catch a failure in the
 * layout that would host it. This one replaces the entire document — which is why it has
 * to supply its own `<html>` and `<body>`, and why it cannot use any app styling or
 * component: the tree that provides them is the tree that just failed. Inline styles
 * only, no imports beyond React.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          padding: '1rem',
        }}
      >
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
            The application failed to start. Reloading may resolve it.
          </p>
          {error.digest ? (
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.6 }}>
              Reference: <code>{error.digest}</code>
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid currentColor',
              background: 'transparent',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
