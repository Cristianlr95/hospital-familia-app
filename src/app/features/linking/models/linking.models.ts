export type LinkStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';

export interface LinkRequestCreateRequest {
  patientCode: string;
}

export interface LinkRequestDto {
  id: number;
  status: LinkStatus;
  requestedAt: string;
  decidedAt?: string | null;
  decisionReason?: string | null;
  patientPublicId?: string | null;
  patientDisplayName?: string | null;
}

export interface LinkedPatientDto {
  patientPublicId: string;
  displayName: string;
}

export interface PendingLinkRequestDto {
  id: number;
  status: LinkStatus;
  requestedAt: string;
  tutorEmail: string;
  tutorFullName: string;
  patientPublicId: string;
  patientDisplayName: string;
}

export interface LinkHistoryItemDto {
  id: number;
  status: LinkStatus;
  requestedAt: string;
  decidedAt?: string | null;
  decisionReason?: string | null;
  tutorEmail: string;
  tutorFullName: string;
  patientPublicId: string;
  patientDisplayName: string;
  decidedByEmail?: string | null;
  decidedByFullName?: string | null;
}

export interface LinkDecisionRequest {
  reason?: string | null;
}
