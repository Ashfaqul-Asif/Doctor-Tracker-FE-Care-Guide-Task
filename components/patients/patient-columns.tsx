import Link from 'next/link';
import type { Patient } from '@/lib/types';
import { DateCell, EmptyCell } from '@/components/common/cells';
import type { Column } from '@/components/common/responsive-table';

/**
 * Patient table columns, defined once for the two screens that show them.
 *
 * The doctor-detail page renders a strict subset — everything on it is already scoped to
 * one known doctor, so the doctor column would be the same value repeated down the page.
 *
 * Both sets are module constants rather than something a page builds in `useMemo`.
 * `ResponsiveTable` is memoised and compares `columns` by identity, so a value that
 * cannot change between renders is the strongest form of the guarantee it needs.
 */

const NAME: Column<Patient> = {
  key: 'name',
  header: 'Patient',
  primary: true,
  cell: (patient) => patient.name,
};

const CONDITION: Column<Patient> = {
  key: 'condition',
  header: 'Condition',
  cell: (patient) => patient.condition,
};

const DOCTOR: Column<Patient> = {
  key: 'doctor',
  header: 'Doctor',
  cell: (patient) =>
    patient.doctor ? (
      <Link href={`/doctors/${patient.doctor.id}`} className="text-primary hover:underline">
        {patient.doctor.name}
      </Link>
    ) : (
      <EmptyCell />
    ),
};

const CONTACT: Column<Patient> = {
  key: 'contactInfo',
  header: 'Contact',
  cell: (patient) => patient.contactInfo,
};

const ADDED: Column<Patient> = {
  key: 'createdAt',
  header: 'Added',
  hideOnMobile: true,
  cell: (patient) => <DateCell iso={patient.createdAt} />,
};

/** For the patients list, where a patient could belong to any doctor. */
export const PATIENT_COLUMNS: Column<Patient>[] = [NAME, CONDITION, DOCTOR, CONTACT, ADDED];

/** For a doctor's detail page, where the doctor is already the subject of the screen. */
export const PATIENT_COLUMNS_WITHOUT_DOCTOR: Column<Patient>[] = [
  NAME,
  CONDITION,
  CONTACT,
  ADDED,
];
