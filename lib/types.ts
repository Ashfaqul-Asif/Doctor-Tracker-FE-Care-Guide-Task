/**
 * Mirrors of the API's response shapes.
 *
 * The client and the API are separate applications with separate installs, so these
 * are hand-maintained rather than imported from a shared package — a deliberate
 * consequence of the repo layout. `docs/api.md` is the contract both sides answer to;
 * change one of these and you are asserting the API changed too.
 */

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * One role. Doctor Tracker is an admin panel — signing in *is* the permission, so no
 * screen branches on this value and nothing in the UI is gated. It is carried because
 * the API returns it, and it is where a second role would first show up.
 */
export type UserRole = 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Login returns the user and nothing else.
 *
 * The session token is delivered as an httpOnly cookie and never appears in a response
 * body — there is deliberately no `accessToken` field to read.
 */
export interface LoginResponse {
  user: AuthUser;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  /** Only present on the detail endpoint. */
  patientCount?: number;
}

export interface PatientDoctorSummary {
  id: string;
  name: string;
  specialization: string;
}

export interface Patient {
  id: string;
  name: string;
  condition: string;
  doctorId: string;
  contactInfo: string;
  createdAt: string;
  updatedAt: string;
  /** Omitted on the doctor-detail list, where the doctor is already known. */
  doctor?: PatientDoctorSummary | null;
}

export interface DoctorFacets {
  specializations: string[];
  hospitals: string[];
}

export interface TopDoctor {
  doctorId: string;
  name: string;
  specialization: string;
  patients: number;
}

export interface DistributionBucket {
  bucket: string;
  doctors: number;
}

export interface DashboardSummary {
  totals: {
    doctors: number;
    patients: number;
    patientsLast30Days: number;
    averagePatientsPerDoctor: number;
  };
  topDoctors: TopDoctor[];
  distribution: DistributionBucket[];
  generatedAt: string;
}

export type TimeInterval = 'day' | 'week' | 'month';

export interface TimeseriesResponse {
  interval: TimeInterval;
  from: string;
  to: string;
  points: Array<{ date: string; count: number }>;
}

// Declared as type aliases rather than interfaces on purpose: only aliases get an
// implicit index signature, which is what lets them be passed straight to the query
// -string builder in `api.ts` without a cast.
export type DoctorListParams = {
  page?: number;
  limit?: number;
  search?: string;
  specialization?: string;
  hospital?: string;
  from?: string;
  to?: string;
};

export type PatientListParams = {
  page?: number;
  limit?: number;
  search?: string;
  condition?: string;
  doctorId?: string;
  from?: string;
  to?: string;
};
