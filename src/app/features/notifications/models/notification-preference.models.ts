export interface NotificationPreferenceDto {
  stateChangesEnabled: boolean;
  eventsEnabled: boolean;
  linkingUpdatesEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  updatedAt: string | null;
}

export type NotificationType =
  | 'STATE_CHANGE'
  | 'NEW_EVENT'
  | 'EVENT_UPDATED'
  | 'LINKING_APPROVED'
  | 'LINKING_REJECTED'
  | 'LINKING_REVOKED';

export interface NotificationDto {
  id: number;
  type: NotificationType;
  patientPublicId: string | null;
  patientDisplayName: string | null;
  title: string;
  message: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPreferenceUpdateRequest {
  stateChangesEnabled: boolean;
  eventsEnabled: boolean;
  linkingUpdatesEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}
