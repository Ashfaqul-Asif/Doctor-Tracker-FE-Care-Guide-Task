'use client';

import { useState } from 'react';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useDoctor, useDoctors } from '@/lib/hooks/use-doctors';
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
  const foundInList = options.some((doctor) => doctor.id === value);
  // Rendered whenever the current value has no matching `<option>` yet — including while
  // the list's first page is still loading — so the `<select>` always has something to
  // bind its value to and never flashes an unmatched-value warning.
  const selectedIsMissing = Boolean(value) && !foundInList;
  // But the extra per-doctor request only fires once the list has actually settled and
  // still doesn't contain it — not on every mount, where `options` starts out empty and
  // would otherwise make any value look "missing" even when it's about to turn up on
  // page one.
  const needsOwnFetch = selectedIsMissing && !doctors.isPending;

  // The select's value can point at a doctor this picker never fetched — it only ever
  // asks for the first 50 (or 50 matching the active search), so a patient's existing
  // doctor is usually not among them. Fetching that one doctor directly is what lets the
  // dropdown show "Dr. Amanda Streich — Cardiology" the moment the form opens, instead of
  // a generic placeholder that makes the selection look like it never took.
  const selected = useDoctor(needsOwnFetch ? value : '');
  const selectedLabel = selected.data
    ? `${selected.data.name} — ${selected.data.specialization}`
    : 'Currently selected';

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
            {selectedIsMissing ? <option value={value}>{selectedLabel}</option> : null}
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
