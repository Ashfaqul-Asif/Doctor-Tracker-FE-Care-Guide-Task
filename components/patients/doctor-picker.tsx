'use client';

import { useState } from 'react';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useDoctors } from '@/lib/hooks/use-doctors';
import { Field, Input, Select } from '@/components/ui/field';

/**
 * Picking a doctor out of a roster that can run to thousands.
 *
 * A plain `<select>` of every doctor is not an option — the list endpoint caps a page at
 * 100 by design — so this pairs a debounced search against the same indexed prefix query
 * the doctors page uses with a native select over the matches. Two native controls
 * rather than a bespoke combobox: no custom keyboard handling to get wrong, and mobile
 * still gets the platform picker.
 */
export function DoctorPicker({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (doctorId: string) => void;
  error?: string | undefined;
}) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const doctors = useDoctors({
    page: 1,
    limit: 50,
    search: debouncedSearch || undefined,
  });

  const options = doctors.data?.data ?? [];
  const selectedIsMissing = value && !options.some((doctor) => doctor.id === value);

  return (
    <div className="space-y-2">
      <Field label="Find a doctor" hint="Type a name to narrow the list below.">
        {({ id, describedBy }) => (
          <Input
            id={id}
            type="search"
            aria-describedby={describedBy}
            placeholder="Start typing a name…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        )}
      </Field>

      <Field label="Doctor" error={error}>
        {({ id, describedBy, invalid }) => (
          <Select
            id={id}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          >
            <option value="">
              {doctors.isPending ? 'Loading doctors…' : 'Select a doctor'}
            </option>
            {/* Keep the current selection selectable even when a search has filtered it
                out of the options, so refining the search doesn't silently clear it. */}
            {selectedIsMissing ? <option value={value}>Currently selected</option> : null}
            {options.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} — {doctor.specialization}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {doctors.isError ? (
        <p role="alert" className="text-xs text-destructive">
          Could not load the doctor list.
        </p>
      ) : null}
    </div>
  );
}
