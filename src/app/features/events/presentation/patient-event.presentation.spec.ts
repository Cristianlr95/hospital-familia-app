import {
  patientEventStatusLabel,
  patientEventTypeColor,
  patientEventTypeLabel,
} from './patient-event.presentation';

describe('patient event presentation', () => {
  it('translates every event type', () => {
    expect(patientEventTypeLabel('SURGERY')).toBe('Cirugía');
    expect(patientEventTypeLabel('STATE_CHANGE')).toBe('Cambio de estado');
    expect(patientEventTypeLabel('DISCHARGE')).toBe('Alta');
  });

  it('translates every event status', () => {
    expect(patientEventStatusLabel('SCHEDULED')).toBe('Programado');
    expect(patientEventStatusLabel('IN_PROGRESS')).toBe('En curso');
    expect(patientEventStatusLabel('COMPLETED')).toBe('Completado');
    expect(patientEventStatusLabel('CANCELLED')).toBe('Cancelado');
  });

  it('provides a stable semantic color token', () => {
    expect(patientEventTypeColor('EXAM')).toBe('exam');
    expect(patientEventTypeColor('VISIT')).toBe('visit');
  });
});
