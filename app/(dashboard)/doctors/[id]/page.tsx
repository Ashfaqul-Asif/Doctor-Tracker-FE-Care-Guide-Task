'use client';

import { ArrowLeft, Pencil, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { useDoctor, useDoctorPatients } from '@/lib/hooks/use-doctors';
import { numberParam, useQueryParams } from '@/lib/hooks/use-query-params';
import type { Patient } from '@/lib/types';
import { Pagination } from '@/components/common/pagination';
import { isEmptyPage, QueryStates } from '@/components/common/query-states';
import { ResponsiveTable } from '@/components/common/responsive-table';
import { RowActions } from '@/components/common/row-actions';
import { EmptyState, ErrorState } from '@/components/common/states';
import { DoctorForm } from '@/components/doctors/doctor-form';
import { PATIENT_COLUMNS_WITHOUT_DOCTOR } from '@/components/patients/patient-columns';
import { PatientForm } from '@/components/patients/patient-form';
import { RemovePatientDialog } from '@/components/patients/remove-patient-dialog';
import { Button } from '@/components/ui/button';
import { Badge, Card, CardHeader, Skeleton } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

const PAGE_SIZE = 10;

const rowKey = (patient: Patient) => patient.id;

export default function DoctorDetailPage() {
  const routeParams = useParams<{ id: string }>();
  const doctorId = routeParams.id;
  const { params, setParams } = useQueryParams();

  const doctor = useDoctor(doctorId);
  const patientsQuery = useMemo(
    () => ({ page: numberParam(params.page, 1), limit: PAGE_SIZE }),
    [params.page],
  );
  const patients = useDoctorPatients(doctorId, patientsQuery);

  const [editOpen, setEditOpen] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>(undefined);
  const [removing, setRemoving] = useState<Patient | undefined>(undefined);

  const onPageChange = useCallback((page: number) => setParams({ page }), [setParams]);

  const renderActions = useCallback(
    (patient: Patient) => (
      <RowActions
        label={patient.name}
        onEdit={() => setEditingPatient(patient)}
        onRemove={() => setRemoving(patient)}
      />
    ),
    [],
  );

  const openAddPatient = useCallback(() => setAddPatientOpen(true), []);

  if (doctor.isError) {
    return <ErrorState error={doctor.error} onRetry={() => void doctor.refetch()} />;
  }

  return (
    <>
      <Link
        href="/doctors"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All doctors
      </Link>

      {doctor.isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      ) : (
        <PageHeader
          title={doctor.data.name}
          description={`${doctor.data.specialization} · ${doctor.data.hospital}`}
          action={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit
              </Button>
              <Button onClick={openAddPatient}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add patient
              </Button>
            </div>
          }
        />
      )}

      {doctor.data ? (
        <Card className="mb-4 grid gap-4 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
            <p className="mt-0.5 truncate text-sm text-foreground">{doctor.data.email}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
            <p className="mt-0.5 text-sm text-foreground">{doctor.data.phone}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Patients</p>
            <p className="mt-0.5 text-sm text-foreground">
              <Badge tone="primary">{doctor.data.patientCount ?? 0}</Badge>
            </p>
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Patients" description="Everyone currently under this doctor's care." />

        <QueryStates
          query={patients}
          loadingLabel="Loading patients"
          isEmpty={isEmptyPage}
          empty={
            <EmptyState
              title="No patients yet"
              description="Patients added here are assigned to this doctor automatically."
              action={
                <Button onClick={openAddPatient}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add patient
                </Button>
              }
            />
          }
        >
          {(page) => (
            <>
              <ResponsiveTable
                caption={`Patients of ${doctor.data?.name ?? 'this doctor'}`}
                columns={PATIENT_COLUMNS_WITHOUT_DOCTOR}
                rows={page.data}
                getRowKey={rowKey}
                actions={renderActions}
              />
              <Pagination meta={page} noun="patients" onPageChange={onPageChange} />
            </>
          )}
        </QueryStates>
      </Card>

      {doctor.data ? (
        <>
          <DoctorForm open={editOpen} onOpenChange={setEditOpen} doctor={doctor.data} />
          <PatientForm
            open={addPatientOpen}
            onOpenChange={setAddPatientOpen}
            lockedDoctor={{ id: doctor.data.id, name: doctor.data.name }}
          />
        </>
      ) : null}

      <PatientForm
        open={Boolean(editingPatient)}
        onOpenChange={(open) => {
          if (!open) setEditingPatient(undefined);
        }}
        {...(editingPatient ? { patient: editingPatient } : {})}
      />

      <RemovePatientDialog patient={removing} onClose={() => setRemoving(undefined)} />
    </>
  );
}
