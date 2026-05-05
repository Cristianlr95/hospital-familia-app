import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.models';
import { LinkRequestCreateRequest, LinkRequestDto, LinkedPatientDto } from '../models/linking.models';

@Injectable({ providedIn: 'root' })
export class LinkingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/linking`;

  requestLink(request: LinkRequestCreateRequest): Observable<LinkRequestDto> {
    return this.http.post<ApiResponse<LinkRequestDto>>(`${this.apiUrl}/request`, request).pipe(
      map((response) => response.data),
    );
  }

  getMyRequests(): Observable<LinkRequestDto[]> {
    return this.http.get<ApiResponse<LinkRequestDto[]>>(`${this.apiUrl}/my-requests`).pipe(
      map((response) => response.data),
    );
  }

  getMyPatients(): Observable<LinkedPatientDto[]> {
    return this.http.get<ApiResponse<LinkedPatientDto[]>>(`${this.apiUrl}/my-patients`).pipe(
      map((response) => response.data),
    );
  }
}
