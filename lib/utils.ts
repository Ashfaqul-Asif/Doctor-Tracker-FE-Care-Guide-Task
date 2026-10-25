import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names, with later Tailwind utilities winning conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// `formatDateTime` and `initials` used to live here. Nothing imported either — no screen
// shows a timestamp to the minute, and there are no avatar chips. Removed rather than
// left as speculative API.
