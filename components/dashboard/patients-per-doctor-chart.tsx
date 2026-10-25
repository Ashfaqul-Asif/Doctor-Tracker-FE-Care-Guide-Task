'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TopDoctor } from '@/lib/types';
import { EmptyState } from '@/components/common/states';
import { ChartDataTable } from './chart-data-table';
import { TOOLTIP_STYLE } from './chart-theme';

/**
 * Horizontal bars: doctor names are long and reading rotated labels is miserable.
 */
export function PatientsPerDoctorChart({ doctors }: { doctors: TopDoctor[] }) {
  if (doctors.length === 0) {
    return (
      <EmptyState
        title="No patient assignments yet"
        description="Once patients are assigned to doctors, the busiest ten appear here."
      />
    );
  }

  // Recharts draws the first datum at the bottom of a vertical layout, so reverse to
  // put the busiest doctor at the top where it reads first.
  const data = [...doctors].reverse();

  return (
    <div className="p-2">
      <div className="h-80 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <defs>
              <linearGradient id="doctorBarsFill" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-chart-1)" />
                <stop offset="100%" stopColor="var(--color-chart-2)" />
              </linearGradient>
            </defs>
            <CartesianGrid horizontal={false} stroke="var(--color-border)" />
            <XAxis
              type="number"
              allowDecimals={false}
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-accent)' }}
              contentStyle={TOOLTIP_STYLE}
              // Recharts types these callbacks loosely (`ValueType | undefined`), so the
              // parameter is widened here rather than asserted at the call site.
              formatter={(value: unknown): [string, string] => [String(value), 'Patients']}
            />
            <Bar dataKey="patients" fill="url(#doctorBarsFill)" radius={[0, 6, 6, 0]} />
          </BarChart>
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
