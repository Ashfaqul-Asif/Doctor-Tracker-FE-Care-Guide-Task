'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { useDoctorFacets, useDoctors } from '@/lib/hooks/use-doctors';
import { useDebouncedSearchParam } from '@/lib/hooks/use-debounced-search-param';
import { numberParam, useQueryParams } from '@/lib/hooks/use-query-params';
import type { Doctor, DoctorListParams } from '@/lib/types';
import { DateCell } from '@/components/common/cells';
import { DateRangeFilter, FilterBar, FilterSelect } from '@/components/common/filter-bar';
import { Pagination } from '@/components/common/pagination';
import { isEmptyPage, QueryStates } from '@/components/common/query-states';
import { ResponsiveTable, type Column } from '@/components/common/responsive-table';
import { RowActions } from '@/components/common/row-actions';
import { EmptyState } from '@/components/common/states';
import { DoctorForm } from '@/components/doctors/doctor-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

const PAGE_SIZE = 20;

// Module constants, not `useMemo`: `ResponsiveTable` is memoised and compares these by
// identity, and a value defined outside the component cannot change between renders.
const COLUMNS: Column<Doctor>[] = [
  {
    key: 'name',
    header: 'Name',
    primary: true,
    cell: (doctor) => (
      <Link href={`/doctors/${doctor.id}`} className="font-medium text-primary hover:underline">
        {doctor.name}
      </Link>
    ),
  },
  { key: 'specialization', header: 'Specialization', cell: (doctor) => doctor.specialization },
  { key: 'hospital', header: 'Hospital', cell: (doctor) => doctor.hospital },
  {
    key: 'contact',
    header: 'Contact',
    cell: (doctor) => (
      <div className="min-w-0">
        <p className="truncate">{doctor.email}</p>
        <p className="truncate text-xs text-muted-foreground">{doctor.phone}</p>
      </div>
    ),
  },
  {
    key: 'createdAt',
    header: 'Added',
    hideOnMobile: true,
    cell: (doctor) => <DateCell iso={doctor.createdAt} />,
  },
];

const rowKey = (doctor: Doctor) => doctor.id;

export default function DoctorsPage() {
  const { params, setParams } = useQueryParams();
  const facets = useDoctorFacets();
  const search = useDebouncedSearchParam();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | undefined>(undefined);

  const query: DoctorListParams = useMemo(
    () => ({
      page: numberParam(params.page, 1),
      limit: PAGE_SIZE,
      search: params.search || undefined,
      specialization: params.specialization || undefined,
      hospital: params.hospital || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
    }),
    [params],
  );

  const doctors = useDoctors(query);

  const hasFilters = Boolean(
    params.search || params.specialization || params.hospital || params.from || params.to,
  );

  // `useCallback` so the memoised children below actually stay memoised. `setParams` and
  // the `useState` setters are already stable, so these never need to change.
  const openCreate = useCallback(() => {
    setEditing(undefined);
    setFormOpen(true);
  }, []);

  const onPageChange = useCallback((page: number) => setParams({ page }), [setParams]);

  const renderActions = useCallback(
    (doctor: Doctor) => (
      <RowActions
        label={doctor.name}
        onEdit={() => {
          setEditing(doctor);
          setFormOpen(true);
        }}
      />
    ),
    [],
  );

  return (
    <>
      <PageHeader
        title="Doctors"
        description="Everyone on the roster, with the patients they look after."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add doctor
          </Button>
        }
      />

      <Card>
        <FilterBar
          searchLabel="Search by name"
          searchPlaceholder="Start typing a name…"
          searchValue={search.value}
          onSearchChange={search.onChange}
          hasFilters={hasFilters}
          onClear={search.clearAll}
        >
          <FilterSelect
            label="Specialization"
            allLabel="All specializations"
            value={params.specialization ?? ''}
            options={facets.data?.specializations ?? []}
            onChange={(value) => setParams({ specialization: value || undefined })}
          />
          <FilterSelect
            label="Hospital"
            allLabel="All hospitals"
            value={params.hospital ?? ''}
            options={facets.data?.hospitals ?? []}
            onChange={(value) => setParams({ hospital: value || undefined })}
          />
          <DateRangeFilter
            from={params.from ?? ''}
            to={params.to ?? ''}
            onChange={(next) => setParams(next)}
          />
        </FilterBar>

        <QueryStates
          query={doctors}
          loadingLabel="Loading doctors"
          isEmpty={isEmptyPage}
          empty={
            <EmptyState
              title={hasFilters ? 'No doctors match those filters' : 'No doctors yet'}
              description={
                hasFilters
                  ? 'Try a different name or clear the filters.'
                  : 'Add the first doctor to get started.'
              }
            />
          }
        >
          {(page) => (
            <>
              <ResponsiveTable
                caption="Doctors"
                columns={COLUMNS}
                rows={page.data}
                getRowKey={rowKey}
                actions={renderActions}
              />
              <Pagination meta={page} noun="doctors" onPageChange={onPageChange} />
            </>
          )}
        </QueryStates>
      </Card>

      <DoctorForm open={formOpen} onOpenChange={setFormOpen} doctor={editing} />
    </>
  );
}
