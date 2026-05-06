import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.models';
import { PatientStatusDto } from '../models/patient-status.models';

@Injectable({ providedIn: 'root' })
export class PatientStatusService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/patients`;

  getMyStatuses(): Observable<PatientStatusDto[]> {
    return this.http.get<ApiResponse<PatientStatusDto[]>>(`${this.apiUrl}/my-statuses`).pipe(
      map((response) => response.data),
    );
  }

  getPatientStatus(patientPublicId: string): Observable<PatientStatusDto> {
    return this.http.get<ApiResponse<PatientStatusDto>>(`${this.apiUrl}/${patientPublicId}/status`).pipe(
      map((response) => response.data),
    );
  }
}
