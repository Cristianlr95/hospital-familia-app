export interface PatientStatusDto {
  patientPublicId: string;
  displayName: string;
  careStatus: string;
  currentService: string;
  currentLocation: string;
  summary?: string | null;
  updatedAt: string;
}
