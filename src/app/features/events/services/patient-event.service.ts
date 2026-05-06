import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.models';
import {
  PatientEventCreateRequest,
  PatientEventDto,
  PatientEventStatus,
} from '../models/patient-event.models';

@Injectable({ providedIn: 'root' })
export class PatientEventService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getUpcomingEventsForTutor(patientPublicId: string): Observable<PatientEventDto[]> {
    return this.http.get<ApiResponse<PatientEventDto[]>>(`${this.apiUrl}/patients/${patientPublicId}/events`).pipe(
      map((response) => response.data),
    );
  }

  getEventsForStaff(patientPublicId: string): Observable<PatientEventDto[]> {
    return this.http.get<ApiResponse<PatientEventDto[]>>(`${this.apiUrl}/events/patient/${patientPublicId}`).pipe(
      map((response) => response.data),
    );
  }

  createEvent(request: PatientEventCreateRequest): Observable<PatientEventDto> {
    return this.http.post<ApiResponse<PatientEventDto>>(`${this.apiUrl}/events`, request).pipe(
      map((response) => response.data),
    );
  }

  changeStatus(id: number, status: PatientEventStatus): Observable<PatientEventDto> {
    return this.http.put<ApiResponse<PatientEventDto>>(`${this.apiUrl}/events/${id}/status`, { status }).pipe(
      map((response) => response.data),
    );
  }
}
