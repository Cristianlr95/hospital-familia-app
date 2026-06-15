export interface BetaExitCheckDto {
  id: number;
  key: string;
  label: string;
  description: string;
  sortOrder: number;
  completed: boolean;
  notes: string | null;
  completedByFullName: string | null;
  completedAt: string | null;
  updatedAt: string;
}

export interface BetaExitChecklistDto {
  generatedAt: string;
  completedChecks: number;
  totalChecks: number;
  progressPercent: number;
  checks: BetaExitCheckDto[];
}

export interface BetaExitCheckUpdateRequest {
  completed: boolean;
  notes: string | null;
}
