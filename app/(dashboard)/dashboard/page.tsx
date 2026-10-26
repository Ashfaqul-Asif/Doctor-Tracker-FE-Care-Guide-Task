'use client';

import { Activity, CalendarPlus, Stethoscope, TrendingUp, Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useDashboardSummary, useDashboardTimeseries } from '@/lib/hooks/use-dashboard';
import type { TimeInterval } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState } from '@/components/common/states';
import { Card, CardHeader, Skeleton } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

/**
 * Recharts pulls in d3 and is the heaviest dependency in the app. Loading it statically
 * put all of it in the first chunk of `/dashboard` — the landing route — where it blocks
 * the stat tiles that need none of it. Split out, the numbers paint first and the charts
 * arrive behind their own skeletons.
 *
 * `ssr: false` because Recharts measures the DOM to size itself; there is nothing for it
 * to measure on the server, and rendering it there only risks a hydration mismatch.
 */
const PatientsPerDoctorChart = dynamic(
  () =>
    import('@/components/dashboard/patients-per-doctor-chart').then(
      (mod) => mod.PatientsPerDoctorChart,
    ),
  { ssr: false, loading: () => <ChartSkeleton height="h-80" /> },
);

const RegistrationsChart = dynamic(
  () => import('@/components/dashboard/registrations-chart').then((mod) => mod.RegistrationsChart),
  { ssr: false, loading: () => <ChartSkeleton height="h-72" /> },
);

function ChartSkeleton({ height }: { height: string }) {
  return (
    <div className="p-4" role="status" aria-live="polite">
      <span className="sr-only">Loading chart</span>
      <Skeleton className={`${height} w-full`} />
    </div>
  );
}


function StatTile({
  label,
  value,
  hint,
  loading,
  icon: Icon,
  accentClass,
}: {
  label: string;
  value: string | number;
  hint?: string;
  loading: boolean;
  icon: typeof Users;
  accentClass: string;
}) {
  return (
    <Card className="relative overflow-hidden p-4">
      {/* A faint radial-ish gradient in the corner that gives the tile its tint. */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-40',
          accentClass,
        )}
      />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-20" />
          ) : (
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
          )}
          {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
        </div>
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            accentClass,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [interval, setInterval] = useState<TimeInterval>('day');
  const summary = useDashboardSummary();
  const timeseries = useDashboardTimeseries(interval);

  const totals = summary.data?.totals;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Roster size, workload distribution, and how registrations are trending."
      />

      {/*
        The summary failing used to early-return the whole screen, taking the
        independently-fetched timeseries panel down with it even though that request had
        succeeded. Each panel now reports its own failure, so one dead endpoint costs one
        card rather than the page.
      */}
      {summary.isError ? (
        <Card className="mb-4">
          <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
        </Card>
      ) : (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Doctors"
            value={totals?.doctors ?? 0}
            loading={summary.isPending}
            icon={Stethoscope}
            accentClass="bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300"
          />
          <StatTile
            label="Patients"
            value={totals?.patients ?? 0}
            loading={summary.isPending}
            icon={Users}
            accentClass="bg-fuchsia-500/10 text-fuchsia-600 dark:bg-fuchsia-400/10 dark:text-fuchsia-300"
          />
          <StatTile
            label="Added (30 days)"
            value={totals?.patientsLast30Days ?? 0}
            loading={summary.isPending}
            icon={CalendarPlus}
            accentClass="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300"
          />
          <StatTile
            label="Avg per doctor"
            value={totals?.averagePatientsPerDoctor ?? 0}
            hint="Across the whole roster"
            loading={summary.isPending}
            icon={TrendingUp}
            accentClass="bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300"
          />
        </div>
      )}

      {/*
        Registrations takes two of three columns on wide screens because the time axis
        needs the room — a squashed trend reads as noise. Caseload sits beside it on wide
        screens as a vertical rail of chips; below `xl` it drops to the bottom so neither
        chart ever gets squeezed.
      */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Registrations over time"
            description="New patients added, bucketed by the selected interval."
          />
          {timeseries.isError ? (
            <ErrorState error={timeseries.error} onRetry={() => void timeseries.refetch()} />
          ) : timeseries.isPending ? (
            <ChartSkeleton height="h-72" />
          ) : (
            <RegistrationsChart
              data={timeseries.data}
              interval={interval}
              onIntervalChange={setInterval}
            />
          )}
        </Card>

        <Card>
          <CardHeader
            title="Caseload distribution"
            description="Doctors grouped by how many patients they look after."
          />
          {summary.isError ? (
            <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
          ) : summary.isPending ? (
            <div className="p-4" role="status" aria-live="polite">
              <span className="sr-only">Loading distribution</span>
              <Skeleton className="h-56 w-full" />
            </div>
          ) : summary.data.distribution.length === 0 ? (
            <EmptyState
              title="No caseload data yet"
              description="Add doctors and assign patients to see how the workload is spread."
            />
          ) : (
            <ul className="space-y-2 p-4">
              {summary.data.distribution.map((bucket) => {
                const peak = Math.max(
                  1,
                  ...summary.data.distribution.map((item) => item.doctors),
                );
                const pct = Math.round((bucket.doctors / peak) * 100);
                return (
                  <li key={bucket.bucket}>
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-foreground">
                        {bucket.bucket} patients
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {bucket.doctors} {bucket.doctors === 1 ? 'doctor' : 'doctors'}
                      </span>
                    </div>
                    {/* Inline track + bar: compact enough to stack a dozen rows. */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundImage: 'var(--primary-gradient)',
                        }}
                        role="progressbar"
                        aria-valuenow={bucket.doctors}
                        aria-valuemin={0}
                        aria-valuemax={peak}
                        aria-label={`${bucket.doctors} doctors with ${bucket.bucket} patients`}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Patients per doctor"
          description="The ten busiest doctors, drawn as concentric rings — longer arc, more patients."
        />
        <div className="flex items-center gap-2 border-b border-border px-5 pb-3 pt-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5" aria-hidden="true" />
          Hover a ring for the exact count.
        </div>
        {summary.isError ? (
          <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
        ) : summary.isPending ? (
          <ChartSkeleton height="h-80" />
        ) : (
          <PatientsPerDoctorChart doctors={summary.data.topDoctors} />
        )}
      </Card>
    </>
  );
}
