export type ContactRequestStatus = 'OPEN' | 'RESOLVED';

export interface ContactRequestDto {
  id: number;
  status: ContactRequestStatus;
  patientPublicId: string;
  patientDisplayName: string;
  tutorEmail: string;
  tutorFullName: string;
  message: string;
  resolutionNote: string | null;
  resolvedByFullName: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactRequestCreateRequest {
  patientPublicId: string;
  message: string;
}

export interface ContactRequestResolveRequest {
  note: string | null;
}
