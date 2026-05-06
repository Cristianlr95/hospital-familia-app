export type PatientEventType =
  | 'SURGERY'
  | 'EXAM'
  | 'VISIT'
  | 'STATE_CHANGE'
  | 'DISCHARGE'
  | 'OTHER';

export type PatientEventStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface PatientEventDto {
  id: number;
  patientPublicId: string;
  patientDisplayName: string;
  type: PatientEventType;
  status: PatientEventStatus;
  title: string;
  description?: string | null;
  scheduledAt: string;
  estimatedDurationMinutes?: number | null;
  service?: string | null;
  location?: string | null;
  responsibleStaff?: string | null;
  createdAt: string;
  updatedAt: string;
}
