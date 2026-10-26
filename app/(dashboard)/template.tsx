import type { ReactNode } from 'react';

/**
 * Fades + lifts each dashboard page in on navigation.
 *
 * `template.tsx` re-mounts its subtree every time the route under it changes — unlike
 * `layout.tsx`, which persists — so a plain CSS keyframe set on the wrapper fires
 * exactly on each navigation, with no state or router hooks involved. The animation
 * itself is defined in `globals.css` as `page-fade-in`, which honours
 * `prefers-reduced-motion` via the existing reduced-motion override there.
 *
 * The wrapper has no visual effect beyond the animation; it is not a sectioning
 * element, so the page's own `<h1>` and semantics are undisturbed.
 */
export default function DashboardSectionTemplate({ children }: { children: ReactNode }) {
  return <div className="page-fade-in">{children}</div>;
}
