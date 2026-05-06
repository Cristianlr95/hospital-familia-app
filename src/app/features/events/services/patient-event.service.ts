import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.models';
import { PatientEventDto } from '../models/patient-event.models';

@Injectable({ providedIn: 'root' })
export class PatientEventService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getUpcomingEventsForTutor(patientPublicId: string): Observable<PatientEventDto[]> {
    return this.http.get<ApiResponse<PatientEventDto[]>>(`${this.apiUrl}/patients/${patientPublicId}/events`).pipe(
      map((response) => response.data),
    );
  }
}
