'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * The route-level error boundary.
 *
 * Every *asynchronous* failure in this app already has a home — `ErrorState` renders it
 * inside the card that owns the query. What had no home was a throw during render: a
 * malformed response reaching a `.map`, a bad cast, a component invariant broken. Next
 * unmounts the whole route for those, and without this file the user gets a white page.
 *
 * The shell stays mounted, so navigation still works and the user is not stranded.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Development gets the real stack in the console; in production the digest is the
    // only handle that ties this screen to the server-side log entry.
    console.error('Route error:', error);
  }, [error]);

  return (
    <Card className="mx-auto mt-10 max-w-md p-6 text-center">
      <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This screen failed to render. The rest of the app is still available.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Reference: <code className="font-mono">{error.digest}</code>
        </p>
      ) : null}
      <Button className="mt-4" onClick={reset}>
        Try again
      </Button>
    </Card>
  );
}
