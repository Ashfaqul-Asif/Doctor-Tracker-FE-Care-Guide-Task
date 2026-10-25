'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiError } from '@/lib/api';
import { useCreateDoctor, useUpdateDoctor, type DoctorInput } from '@/lib/hooks/use-doctors';
import type { Doctor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input } from '@/components/ui/field';
import { FormError } from '@/components/ui/form-error';

/** Mirrors the API's zod schema so the messages match what the server would say. */
const doctorSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  specialization: z.string().trim().min(2, 'Specialization is required').max(120),
  hospital: z.string().trim().min(2, 'Hospital is required').max(160),
  phone: z.string().trim().min(5, 'Phone number is required').max(40),
  email: z.email('Enter a valid email address').max(160),
});

type DoctorValues = z.infer<typeof doctorSchema>;

const EMPTY: DoctorValues = { name: '', specialization: '', hospital: '', phone: '', email: '' };

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

interface DoctorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing; absent when creating. */
  doctor?: Doctor;
}

export function DoctorForm({ open, onOpenChange, doctor }: DoctorFormProps) {
  const isEdit = Boolean(doctor);
  const createDoctor = useCreateDoctor();
  const updateDoctor = useUpdateDoctor(doctor?.id ?? '');
  const mutation = isEdit ? updateDoctor : createDoctor;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<DoctorValues>({ resolver: zodResolver(doctorSchema), defaultValues: EMPTY });

  // Reopening the dialog for a different doctor must not show the previous one's values.
  useEffect(() => {
    if (!open) return;
    reset(
      doctor
        ? {
            name: doctor.name,
            specialization: doctor.specialization,
            hospital: doctor.hospital,
            phone: doctor.phone,
            email: doctor.email,
          }
        : EMPTY,
    );
  }, [open, doctor, reset]);

  const onSubmit = (values: DoctorValues) => {
    mutation.mutate(values as DoctorInput, {
      onSuccess: () => onOpenChange(false),
      onError: (error) => {
        // The server validates independently; surface its field errors on the fields
        // rather than as an anonymous banner.
        if (error instanceof ApiError && error.isValidation) {
          for (const detail of error.details) {
            if (detail.field in EMPTY) {
              setError(detail.field as keyof DoctorValues, { message: detail.message });
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
      title={isEdit ? 'Edit doctor' : 'Add doctor'}
      description={
        isEdit ? 'Update this doctor’s details.' : 'Add a doctor to the roster.'
      }
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormError message={formError} />

        <Field label="Full name" error={errors.name?.message}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} autoFocus aria-invalid={invalid} aria-describedby={describedBy} {...register('name')} />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Specialization" error={errors.specialization?.message}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} aria-invalid={invalid} aria-describedby={describedBy} {...register('specialization')} />
            )}
          </Field>

          <Field label="Hospital" error={errors.hospital?.message}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} aria-invalid={invalid} aria-describedby={describedBy} {...register('hospital')} />
            )}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" error={errors.phone?.message}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} type="tel" aria-invalid={invalid} aria-describedby={describedBy} {...register('phone')} />
            )}
          </Field>

          <Field label="Email" error={errors.email?.message}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} type="email" aria-invalid={invalid} aria-describedby={describedBy} {...register('email')} />
            )}
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add doctor'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
