export interface NotificationPreferenceDto {
  stateChangesEnabled: boolean;
  eventsEnabled: boolean;
  linkingUpdatesEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  updatedAt: string | null;
}

export interface NotificationPreferenceUpdateRequest {
  stateChangesEnabled: boolean;
  eventsEnabled: boolean;
  linkingUpdatesEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}
