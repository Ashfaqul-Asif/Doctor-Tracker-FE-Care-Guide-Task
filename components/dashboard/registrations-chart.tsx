'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TimeInterval, TimeseriesResponse } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/common/states';
import { ChartDataTable } from './chart-data-table';
import { TOOLTIP_STYLE } from './chart-theme';

const INTERVALS: TimeInterval[] = ['day', 'week', 'month'];

function formatTick(iso: string, interval: TimeInterval): string {
  const date = new Date(iso);
  if (interval === 'month') {
    return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit', timeZone: 'UTC' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function RegistrationsChart({
  data,
  interval,
  onIntervalChange,
}: {
  data: TimeseriesResponse | undefined;
  interval: TimeInterval;
  onIntervalChange: (interval: TimeInterval) => void;
}) {
  const points = data?.points ?? [];

  return (
    <div className="p-2">
      <div
        className="mb-2 flex justify-end gap-1 px-2"
        role="group"
        aria-label="Time interval"
      >
        {INTERVALS.map((option) => (
          <button
            key={option}
            type="button"
            // `aria-pressed` is what tells a screen reader which grouping is active —
            // the colour change alone says nothing.
            aria-pressed={interval === option}
            onClick={() => onIntervalChange(option)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
              interval === option
                ? 'bg-primary-soft text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {points.length === 0 ? (
        // An empty series would otherwise render as a bare pair of axes with nothing
        // plotted, which reads as a broken chart rather than as "no data yet". The
        // interval toggle stays above it, so switching to a range that *has* data is
        // still one click away.
        <EmptyState
          title="Nothing registered in this range"
          description="Try a wider interval, or add a patient to see the trend start."
        />
      ) : (
        <>
      <div className="h-72 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <defs>
              <linearGradient id="registrationsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="registrationsStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-chart-1)" />
                <stop offset="100%" stopColor="var(--color-chart-2)" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => formatTick(value, interval)}
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              width={36}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(label: unknown) => formatTick(String(label), interval)}
              formatter={(value: unknown): [string, string] => [String(value), 'Patients added']}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="url(#registrationsStroke)"
              strokeWidth={2.5}
              fill="url(#registrationsFill)"
              dot={{ r: 2.5, strokeWidth: 0, fill: 'var(--color-chart-1)' }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--color-card)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

          <ChartDataTable
            caption={`Patients added per ${interval}`}
            columns={[interval === 'month' ? 'Month' : 'Date', 'Patients added']}
            rows={points.map((point) => [formatTick(point.date, interval), point.count])}
          />
        </>
      )}
    </div>
  );
}
