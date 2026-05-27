export interface StaffPatientDto {
  publicId: string;
  displayName: string;
  linkCode: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffPatientCreateRequest {
  displayName: string;
  linkCode: string;
}
