import type { ReactNode } from 'react';

/**
 * The title block every screen opens with.
 *
 * Lives here rather than in `app-shell` because it has nothing to do with the shell —
 * no navigation, no session, no layout state. It is a presentational primitive that
 * happened to be defined next to one.
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
