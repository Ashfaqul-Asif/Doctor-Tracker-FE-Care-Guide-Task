'use client';

import { useRemovePatient } from '@/lib/hooks/use-patients';
import type { Patient } from '@/lib/types';
import { ConfirmDialog } from '@/components/common/confirm-dialog';

interface RemovePatientDialogProps {
  /** The patient awaiting confirmation, or `undefined` when the dialog is closed. */
  patient: Patient | undefined;
  onClose: () => void;
}

/**
 * Confirmation for a patient removal, owned in one place.
 *
 * Both the patients list and a doctor's detail page can remove a patient, and both had
 * their own copy of this dialog — including the sentence explaining that the record is
 * retained. Two copies of user-facing wording is how two screens end up describing the
 * same action differently.
 *
 * It owns the mutation too, so neither screen has to hold a `useRemovePatient` it only
 * uses here.
 */
export function RemovePatientDialog({ patient, onClose }: RemovePatientDialogProps) {
  const removePatient = useRemovePatient();

  return (
    <ConfirmDialog
      open={Boolean(patient)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Remove this patient?"
      description={`${patient?.name ?? 'This patient'} will be removed from the list. The record is retained for reporting and can be restored by an administrator.`}
      confirmLabel="Remove"
      pending={removePatient.isPending}
      onConfirm={() => {
        if (!patient) return;
        removePatient.mutate(patient.id, { onSettled: onClose });
      }}
    />
  );
}
