'use client';

import { Activity, LayoutDashboard, LogOut, Menu, Stethoscope, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useLogout } from '@/lib/hooks/use-auth';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/doctors', label: 'Doctors', icon: Stethoscope },
  { href: '/patients', label: 'Patients', icon: Users },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary-soft text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-3 py-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Activity className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold text-foreground">Doctor Tracker</span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const mobileNavOpen = useUiStore((state) => state.mobileNavOpen);
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);
  const toggleMobileNav = useUiStore((state) => state.toggleMobileNav);
  const pathname = usePathname();
  const logout = useLogout();

  // Leaving the drawer open across a navigation would hide the page the user just
  // asked for behind the menu they used to ask for it.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="hidden border-r border-border bg-card lg:block">
        <div className="sticky top-0 flex h-dvh flex-col">
          <Brand />
          <nav aria-label="Main" className="flex-1 px-2">
            <NavLinks />
          </nav>
          <div className="border-t border-border p-3">
            <p className="truncate px-1 pb-2 text-xs text-muted-foreground" title={user?.email}>
              {user?.email}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b border-border bg-card px-3 py-2 lg:hidden">
          <Brand />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-nav"
            onClick={toggleMobileNav}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
        </header>

        {mobileNavOpen ? (
          <nav
            id="mobile-nav"
            aria-label="Main"
            className="border-b border-border bg-card px-2 py-2 lg:hidden"
          >
            <NavLinks onNavigate={() => setMobileNavOpen(false)} />
            <div className="mt-2 border-t border-border pt-2">
              <p className="truncate px-3 pb-1 text-xs text-muted-foreground">{user?.email}</p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => logout.mutate()}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </Button>
            </div>
          </nav>
        ) : null}

        <main id="main" className="min-w-0 flex-1 px-3 py-4 sm:px-6 sm:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// `PageHeader` used to live here. It is a presentational primitive with no relationship
// to the shell, so it moved to components/ui/page-header.tsx.
