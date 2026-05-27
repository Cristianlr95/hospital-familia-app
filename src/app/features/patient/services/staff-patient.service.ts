import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.models';
import { StaffPatientCreateRequest, StaffPatientDto } from '../models/staff-patient.models';

@Injectable({ providedIn: 'root' })
export class StaffPatientService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/staff/patients`;

  getActivePatients(): Observable<StaffPatientDto[]> {
    return this.http.get<ApiResponse<StaffPatientDto[]>>(this.apiUrl).pipe(
      map((response) => response.data),
    );
  }

  createPatient(request: StaffPatientCreateRequest): Observable<StaffPatientDto> {
    return this.http.post<ApiResponse<StaffPatientDto>>(this.apiUrl, request).pipe(
      map((response) => response.data),
    );
  }
}
