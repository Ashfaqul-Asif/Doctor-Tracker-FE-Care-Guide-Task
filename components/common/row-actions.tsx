'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RowActionsProps {
  /**
   * The row's own name. Used to build the accessible label, so a screen reader user
   * hears "Edit Jordan Fields" rather than the fifth of nine identical "Edit" buttons.
   */
  label: string;
  onEdit: () => void;
  /** Omitted where the row cannot be removed — doctors have no delete endpoint. */
  onRemove?: (() => void) | undefined;
}

/** The per-row control cluster, shared by every table that has one. */
export function RowActions({ label, onEdit, onRemove }: RowActionsProps) {
  return (
    <>
      <Button variant="ghost" size="sm" aria-label={`Edit ${label}`} onClick={onEdit}>
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </Button>
      {onRemove ? (
        <Button variant="ghost" size="sm" aria-label={`Remove ${label}`} onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
        </Button>
      ) : null}
    </>
  );
}
