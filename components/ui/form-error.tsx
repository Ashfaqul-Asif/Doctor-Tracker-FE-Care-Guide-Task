/**
 * The banner for a submission failure that is not a field-level validation error —
 * a conflict, a permission refusal, the API being unreachable.
 *
 * `role="alert"` so it is announced when it appears: a user who submitted and saw
 * nothing change otherwise has no way to know the request came back at all.
 */
export function FormError({ message }: { message: string | null | undefined }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/40 bg-destructive-soft px-3 py-2 text-sm text-destructive"
    >
      {message}
    </div>
  );
}
