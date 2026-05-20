export interface PatientStatusDto {
  patientPublicId: string;
  displayName: string;
  careStatus: string;
  currentService: string;
  currentLocation: string;
  summary?: string | null;
  updatedAt: string;
}

export interface PatientStatusUpdateRequest {
  careStatus: string;
  currentService: string | null;
  currentLocation: string | null;
  summary: string | null;
}
