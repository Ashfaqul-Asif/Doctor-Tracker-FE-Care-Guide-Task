'use client';

import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useDebouncedSearchParam } from '@/lib/hooks/use-debounced-search-param';
import { usePatientConditions, usePatients } from '@/lib/hooks/use-patients';
import { numberParam, useQueryParams } from '@/lib/hooks/use-query-params';
import type { Patient, PatientListParams } from '@/lib/types';
import { DateRangeFilter, FilterBar, FilterSelect } from '@/components/common/filter-bar';
import { Pagination } from '@/components/common/pagination';
import { isEmptyPage, QueryStates } from '@/components/common/query-states';
import { ResponsiveTable } from '@/components/common/responsive-table';
import { RowActions } from '@/components/common/row-actions';
import { EmptyState } from '@/components/common/states';
import { PATIENT_COLUMNS } from '@/components/patients/patient-columns';
import { PatientForm } from '@/components/patients/patient-form';
import { RemovePatientDialog } from '@/components/patients/remove-patient-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

const PAGE_SIZE = 20;

const rowKey = (patient: Patient) => patient.id;

export default function PatientsPage() {
  const { params, setParams } = useQueryParams();
  const conditions = usePatientConditions();
  const search = useDebouncedSearchParam();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | undefined>(undefined);
  const [removing, setRemoving] = useState<Patient | undefined>(undefined);

  const query: PatientListParams = useMemo(
    () => ({
      page: numberParam(params.page, 1),
      limit: PAGE_SIZE,
      search: params.search || undefined,
      condition: params.condition || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
    }),
    [params],
  );

  const patients = usePatients(query);

  const hasFilters = Boolean(params.search || params.condition || params.from || params.to);

  const openCreate = useCallback(() => {
    setEditing(undefined);
    setFormOpen(true);
  }, []);

  const onPageChange = useCallback((page: number) => setParams({ page }), [setParams]);

  const renderActions = useCallback(
    (patient: Patient) => (
      <RowActions
        label={patient.name}
        onEdit={() => {
          setEditing(patient);
          setFormOpen(true);
        }}
        onRemove={() => setRemoving(patient)}
      />
    ),
    [],
  );

  return (
    <>
      <PageHeader
        title="Patients"
        description="Every patient on record, independent of which doctor they see."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add patient
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
            label="Condition"
            allLabel="All conditions"
            value={params.condition ?? ''}
            options={conditions.data ?? []}
            onChange={(value) => setParams({ condition: value || undefined })}
          />
          <DateRangeFilter
            from={params.from ?? ''}
            to={params.to ?? ''}
            onChange={(next) => setParams(next)}
          />
        </FilterBar>

        <QueryStates
          query={patients}
          loadingLabel="Loading patients"
          isEmpty={isEmptyPage}
          empty={
            <EmptyState
              title={hasFilters ? 'No patients match those filters' : 'No patients yet'}
              description={
                hasFilters
                  ? 'Try a different name or clear the filters.'
                  : 'Add the first patient to get started.'
              }
            />
          }
        >
          {(page) => (
            <>
              <ResponsiveTable
                caption="Patients"
                columns={PATIENT_COLUMNS}
                rows={page.data}
                getRowKey={rowKey}
                actions={renderActions}
              />
              <Pagination meta={page} noun="patients" onPageChange={onPageChange} />
            </>
          )}
        </QueryStates>
      </Card>

      <PatientForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(undefined);
        }}
        {...(editing ? { patient: editing } : {})}
      />

      <RemovePatientDialog patient={removing} onClose={() => setRemoving(undefined)} />
    </>
  );
}
