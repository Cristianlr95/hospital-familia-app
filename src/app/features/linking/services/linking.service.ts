import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.models';
import {
  LinkDecisionRequest,
  LinkHistoryItemDto,
  LinkRequestCreateRequest,
  LinkRequestDto,
  LinkedPatientDto,
  PendingLinkRequestDto,
} from '../models/linking.models';

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

  getPendingRequests(): Observable<PendingLinkRequestDto[]> {
    return this.http.get<ApiResponse<PendingLinkRequestDto[]>>(`${this.apiUrl}/pending`).pipe(
      map((response) => response.data),
    );
  }

  getLinkHistory(): Observable<LinkHistoryItemDto[]> {
    return this.http.get<ApiResponse<LinkHistoryItemDto[]>>(`${this.apiUrl}/history`).pipe(
      map((response) => response.data),
    );
  }

  approveRequest(id: number): Observable<PendingLinkRequestDto> {
    return this.http.put<ApiResponse<PendingLinkRequestDto>>(`${this.apiUrl}/${id}/approve`, {}).pipe(
      map((response) => response.data),
    );
  }

  rejectRequest(id: number, request: LinkDecisionRequest): Observable<PendingLinkRequestDto> {
    return this.http.put<ApiResponse<PendingLinkRequestDto>>(`${this.apiUrl}/${id}/reject`, request).pipe(
      map((response) => response.data),
    );
  }
}
