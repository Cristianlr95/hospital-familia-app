import { PatientEventStatus, PatientEventType } from '../models/patient-event.models';

export const PATIENT_EVENT_TYPE_LABELS: Readonly<Record<PatientEventType, string>> = {
  SURGERY: 'Cirugía',
  EXAM: 'Examen',
  VISIT: 'Visita',
  STATE_CHANGE: 'Cambio de estado',
  DISCHARGE: 'Alta',
  OTHER: 'Otro',
};

export const PATIENT_EVENT_STATUS_LABELS: Readonly<Record<PatientEventStatus, string>> = {
  SCHEDULED: 'Programado',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

export const PATIENT_EVENT_TYPE_COLORS: Readonly<Record<PatientEventType, string>> = {
  SURGERY: 'surgery',
  EXAM: 'exam',
  VISIT: 'visit',
  STATE_CHANGE: 'state',
  DISCHARGE: 'discharge',
  OTHER: 'other',
};

export function patientEventTypeLabel(type: PatientEventType): string {
  return PATIENT_EVENT_TYPE_LABELS[type];
}

export function patientEventStatusLabel(status: PatientEventStatus): string {
  return PATIENT_EVENT_STATUS_LABELS[status];
}

export function patientEventTypeColor(type: PatientEventType): string {
  return PATIENT_EVENT_TYPE_COLORS[type];
}
