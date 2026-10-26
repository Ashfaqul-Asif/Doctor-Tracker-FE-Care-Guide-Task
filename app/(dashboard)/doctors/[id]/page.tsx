'use client';

import {
  ArrowLeft,
  Building2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Stethoscope,
  Users,
} from 'lucide-react';
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
import { Card, CardHeader, Skeleton } from '@/components/ui/card';

const PAGE_SIZE = 10;

const rowKey = (patient: Patient) => patient.id;

/**
 * Reduces a name to one or two letters for the avatar circle. "John Smith" → "JS".
 * One name → one letter. Blank → "?" so we never render an empty bubble.
 */
function initialsOf(name: string | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return (parts[0]!.slice(0, 1) + parts[parts.length - 1]!.slice(0, 1)).toUpperCase();
}

/**
 * One small info row inside the hero card. The icon tints with the primary accent, the
 * label is a quiet uppercase caption, and the value takes the visual weight.
 */
function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-foreground">{children}</p>
      </div>
    </div>
  );
}

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

      {/* Hero card: avatar + name block, then stat strip, then contact grid. */}
      <Card className="mb-4 overflow-hidden">
        {/*
          The header strip carries the gradient so the whole doctor identity reads as one
          unit on first glance. The gradient is the same `--primary-gradient` token the
          login brand panel and the primary button use, so this card doesn't invent a
          second palette.
        */}
        <div
          className="relative px-5 pb-14 pt-5 text-primary-foreground"
          style={{ backgroundImage: 'var(--primary-gradient)' }}
        >
          {doctor.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-56 bg-white/30" />
              <Skeleton className="h-4 w-40 bg-white/20" />
            </div>
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight">
                  {doctor.data.name}
                </h1>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary-foreground/90">
                  <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
                  {doctor.data.specialization}
                  <span aria-hidden="true" className="opacity-50">
                    ·
                  </span>
                  <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {doctor.data.hospital}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setEditOpen(true)}
                  className="bg-white/15 text-primary-foreground backdrop-blur-sm hover:bg-white/25"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  onClick={openAddPatient}
                  className="bg-white text-primary shadow-sm hover:bg-white hover:brightness-95"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add patient
                </Button>
              </div>
            </div>
          )}
        </div>

        {/*
          The avatar/stat strip overlaps the gradient so the hero reads as one shape; the
          negative top margin pulls it up over the padded gradient bottom. Below `sm` the
          strip stacks under the gradient instead of beside it, so the avatar never gets
          clipped by a narrow viewport.
        */}
        <div className="-mt-10 flex flex-wrap items-end gap-4 px-5 pb-5 sm:items-center">
          <span
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-primary-soft text-xl font-semibold text-primary shadow-sm"
            aria-hidden="true"
          >
            {initialsOf(doctor.data?.name)}
          </span>

          {doctor.data ? (
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-2 pt-10 sm:pt-0">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Patients
                </p>
                <p className="inline-flex items-baseline gap-1.5 text-2xl font-semibold tabular-nums text-foreground">
                  <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                  {doctor.data.patientCount ?? 0}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Contact grid — three info rows with iconography. */}
        {doctor.data ? (
          <div className="grid gap-4 border-t border-border px-5 py-4 sm:grid-cols-3">
            <InfoRow icon={Mail} label="Email">
              <a href={`mailto:${doctor.data.email}`} className="hover:text-primary">
                {doctor.data.email}
              </a>
            </InfoRow>
            <InfoRow icon={Phone} label="Phone">
              <a href={`tel:${doctor.data.phone}`} className="hover:text-primary">
                {doctor.data.phone}
              </a>
            </InfoRow>
            <InfoRow icon={Building2} label="Hospital">
              {doctor.data.hospital}
            </InfoRow>
          </div>
        ) : null}
      </Card>

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
