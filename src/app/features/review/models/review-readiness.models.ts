export interface ReviewReadinessCheckDto {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface ReviewReadinessDto {
  generatedAt: string;
  activePatientCount: number;
  pendingLinkRequestCount: number;
  approvedLinkCount: number;
  upcomingEventCount: number;
  unreadNotificationCount: number;
  passedChecks: number;
  totalChecks: number;
  checks: ReviewReadinessCheckDto[];
}
