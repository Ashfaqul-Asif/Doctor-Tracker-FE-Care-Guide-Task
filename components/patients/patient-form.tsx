'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiError } from '@/lib/api';
import { useCreatePatient, useUpdatePatient, type PatientInput } from '@/lib/hooks/use-patients';
import type { Patient } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input } from '@/components/ui/field';
import { FormError } from '@/components/ui/form-error';
import { DoctorPicker } from './doctor-picker';

const patientSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  condition: z.string().trim().min(2, 'Condition is required').max(160),
  doctorId: z.string().min(1, 'Select a doctor'),
  contactInfo: z.string().trim().min(3, 'Contact details are required').max(200),
});

type PatientValues = z.infer<typeof patientSchema>;

const EMPTY: PatientValues = { name: '', condition: '', doctorId: '', contactInfo: '' };

/**
 * What the banner should say, or `null` when the fields are already saying it.
 *
 * A validation error normally lands on the fields, so the banner stays quiet. The
 * exception is a validation error naming only fields this form does not render — with
 * nowhere to display it, staying quiet would mean the submit failed and said nothing.
 */
function bannerMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (!error.isValidation) return error.message;
  return error.details.some((detail) => detail.field in EMPTY) ? null : error.message;
}

interface PatientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient;
  /**
   * FR-12: opened from a doctor's detail page, the doctor is pre-filled and fixed —
   * the user came here to add a patient to *this* doctor.
   */
  lockedDoctor?: { id: string; name: string };
}

export function PatientForm({ open, onOpenChange, patient, lockedDoctor }: PatientFormProps) {
  const isEdit = Boolean(patient);
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient(patient?.id ?? '');
  const mutation = isEdit ? updatePatient : createPatient;

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<PatientValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: { name: '', condition: '', doctorId: lockedDoctor?.id ?? '', contactInfo: '' },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: patient?.name ?? '',
      condition: patient?.condition ?? '',
      doctorId: patient?.doctorId ?? lockedDoctor?.id ?? '',
      contactInfo: patient?.contactInfo ?? '',
    });
  }, [open, patient, lockedDoctor, reset]);

  const onSubmit = (values: PatientValues) => {
    mutation.mutate(values as PatientInput, {
      onSuccess: () => onOpenChange(false),
      onError: (error) => {
        // The server validates independently; surface its field errors on the fields
        // rather than as an anonymous banner.
        if (error instanceof ApiError && error.isValidation) {
          for (const detail of error.details) {
            // Guarded, because an error naming a field this form does not render would
            // otherwise be stored by RHF and displayed by nothing — the submit would
            // fail silently. Anything unrecognised falls through to the banner below.
            if (detail.field in EMPTY) {
              setError(detail.field as keyof PatientValues, { message: detail.message });
            }
          }
        }
      },
    });
  };

  const formError = bannerMessage(mutation.error);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit patient' : 'Add patient'}
      description={
        lockedDoctor
          ? `This patient will be assigned to ${lockedDoctor.name}.`
          : 'Every patient is assigned to a doctor.'
      }
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormError message={formError} />

        <Field label="Full name" error={errors.name?.message}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} autoFocus aria-invalid={invalid} aria-describedby={describedBy} {...register('name')} />
          )}
        </Field>

        <Field label="Condition" error={errors.condition?.message}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} aria-invalid={invalid} aria-describedby={describedBy} {...register('condition')} />
          )}
        </Field>

        <Field label="Contact info" error={errors.contactInfo?.message}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              placeholder="Phone or email"
              {...register('contactInfo')}
            />
          )}
        </Field>

        {lockedDoctor ? (
          <div className="rounded-md border border-border bg-muted px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Doctor</p>
            <p className="text-sm font-medium text-foreground">{lockedDoctor.name}</p>
            <input type="hidden" {...register('doctorId')} />
          </div>
        ) : (
          <Controller
            control={control}
            name="doctorId"
            render={({ field }) => (
              <DoctorPicker
                value={field.value}
                onChange={field.onChange}
                error={errors.doctorId?.message}
              />
            )}
          />
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add patient'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
