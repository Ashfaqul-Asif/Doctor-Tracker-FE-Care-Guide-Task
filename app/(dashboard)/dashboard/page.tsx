'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useDashboardSummary, useDashboardTimeseries } from '@/lib/hooks/use-dashboard';
import type { TimeInterval } from '@/lib/types';
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
}: {
  label: string;
  value: string | number;
  hint?: string;
  loading: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-20" />
      ) : (
        <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      )}
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
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
          <StatTile label="Doctors" value={totals?.doctors ?? 0} loading={summary.isPending} />
          <StatTile label="Patients" value={totals?.patients ?? 0} loading={summary.isPending} />
          <StatTile
            label="Added (30 days)"
            value={totals?.patientsLast30Days ?? 0}
            loading={summary.isPending}
          />
          <StatTile
            label="Avg per doctor"
            value={totals?.averagePatientsPerDoctor ?? 0}
            hint="Across the whole roster"
            loading={summary.isPending}
          />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Patients per doctor"
            description="The ten busiest doctors by current caseload."
          />
          {summary.isError ? (
            <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
          ) : summary.isPending ? (
            <ChartSkeleton height="h-80" />
          ) : (
            <PatientsPerDoctorChart doctors={summary.data.topDoctors} />
          )}
        </Card>

        <Card>
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
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Caseload distribution"
          description="How many doctors carry how many patients."
        />
        {summary.isError ? (
          <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
        ) : summary.isPending ? (
          <div className="p-4" role="status" aria-live="polite">
            <span className="sr-only">Loading distribution</span>
            <Skeleton className="h-24 w-full" />
          </div>
        ) : summary.data.distribution.length === 0 ? (
          // Without this the empty array rendered a `<ul>` containing nothing — a
          // labelled card with a blank space under it, indistinguishable from a bug.
          <EmptyState
            title="No caseload data yet"
            description="Add doctors and assign patients to see how the workload is spread."
          />
        ) : (
          <ul className="grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
            {summary.data.distribution.map((bucket) => (
              <li key={bucket.bucket} className="rounded-md border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">{bucket.bucket} patients</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {bucket.doctors}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    {bucket.doctors === 1 ? 'doctor' : 'doctors'}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
