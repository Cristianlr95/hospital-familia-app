export type ActivityAudience = 'TUTOR' | 'STAFF';
export type ActivityKind = 'LINK' | 'LINK_PENDING' | 'LINK_HISTORY' | 'EVENT' | 'STATUS';

export interface ActivityFeedItemDto {
  audience: ActivityAudience;
  kind: ActivityKind;
  occurredAt: string;
  patientPublicId: string;
  patientDisplayName: string;
  title: string;
  message: string;
  status?: string | null;
  actorName?: string | null;
}
