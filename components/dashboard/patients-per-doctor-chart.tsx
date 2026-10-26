'use client';

import {
  Legend,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { TopDoctor } from '@/lib/types';
import { EmptyState } from '@/components/common/states';
import { ChartDataTable } from './chart-data-table';
import { TOOLTIP_STYLE } from './chart-theme';

/**
 * Patients-per-doctor as a radial bar chart.
 *
 * Previously this was a horizontal bar chart — perfectly fine, but visually the same
 * shape every basic dashboard reaches for. Radial bars read as rings around a common
 * centre, which encodes the "top ten" ranking as concentric arcs instead of a stack of
 * bars. Each ring is one doctor; the arc length is the patient count, measured against
 * the busiest doctor as 100%. The ordering is still "busiest on the outside, quietest on
 * the inside," so the chart is still ranked, just differently shaped.
 *
 * Accessibility: the chart itself is `aria-hidden`; the underlying numbers are rendered
 * verbatim by `ChartDataTable` below it, so a screen reader always has the real data to
 * read.
 */

// A ten-stop ramp between chart-1 and chart-2, mirroring the gradient used elsewhere.
// Precomputed so the ring colours don't depend on where a given doctor's name sorts.
const RING_COLOURS = [
  'var(--color-chart-1)',
  'color-mix(in srgb, var(--color-chart-1) 88%, var(--color-chart-2))',
  'color-mix(in srgb, var(--color-chart-1) 76%, var(--color-chart-2))',
  'color-mix(in srgb, var(--color-chart-1) 64%, var(--color-chart-2))',
  'color-mix(in srgb, var(--color-chart-1) 52%, var(--color-chart-2))',
  'color-mix(in srgb, var(--color-chart-1) 40%, var(--color-chart-2))',
  'color-mix(in srgb, var(--color-chart-1) 28%, var(--color-chart-2))',
  'color-mix(in srgb, var(--color-chart-1) 16%, var(--color-chart-2))',
  'color-mix(in srgb, var(--color-chart-1) 8%, var(--color-chart-2))',
  'var(--color-chart-2)',
];

export function PatientsPerDoctorChart({ doctors }: { doctors: TopDoctor[] }) {
  if (doctors.length === 0) {
    return (
      <EmptyState
        title="No patient assignments yet"
        description="Once patients are assigned to doctors, the busiest ten appear here."
      />
    );
  }

  // Radial bars draw outermost → innermost in input order, so pass the busiest first and
  // the quietest last; that way "most patients" is the longest outer ring, which matches
  // the mental model "big = many". Each doctor also gets a per-datum fill from the ramp.
  const data = doctors.map((doctor, index) => ({
    name: doctor.name,
    specialization: doctor.specialization,
    patients: doctor.patients,
    fill: RING_COLOURS[Math.min(index, RING_COLOURS.length - 1)],
  }));

  // Scale every ring to the leader so the ranking is read at a glance; otherwise the
  // top doctor's ring doesn't close and the chart looks under-drawn.
  const peak = Math.max(...data.map((d) => d.patients));

  return (
    <div className="p-2">
      <div className="h-80 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            innerRadius="22%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            barSize={10}
          >
            <PolarAngleAxis type="number" domain={[0, peak]} tick={false} />
            <RadialBar
              background={{ fill: 'var(--color-muted)' }}
              dataKey="patients"
              cornerRadius={6}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: unknown, _name: unknown, entry: unknown) => {
                // Recharts' tooltip types are loose; narrow here and read what we need.
                const payload =
                  (entry as { payload?: { specialization?: string } } | undefined)?.payload;
                const spec = payload?.specialization ? ` · ${payload.specialization}` : '';
                return [`${String(value)} patients${spec}`, ''] as [string, string];
              }}
              labelFormatter={(label: unknown) => String(label)}
            />
            <Legend
              iconType="circle"
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ fontSize: 11, lineHeight: '1.4', paddingLeft: 8 }}
              formatter={(value: string) => (
                <span style={{ color: 'var(--color-muted-foreground)' }}>{value}</span>
              )}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      <ChartDataTable
        caption="Patients per doctor, top ten"
        columns={['Doctor', 'Patients']}
        rows={doctors.map((doctor) => [`${doctor.name} (${doctor.specialization})`, doctor.patients])}
      />
    </div>
  );
}
