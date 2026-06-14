import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.models';
import {
  ContactRequestCreateRequest,
  ContactRequestDto,
  ContactRequestResolveRequest,
} from '../models/contact-request.models';

@Injectable({ providedIn: 'root' })
export class ContactRequestService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/contact-requests`;

  create(request: ContactRequestCreateRequest): Observable<ContactRequestDto> {
    return this.http.post<ApiResponse<ContactRequestDto>>(this.apiUrl, request).pipe(
      map((response) => response.data),
    );
  }

  getMyRequests(): Observable<ContactRequestDto[]> {
    return this.http.get<ApiResponse<ContactRequestDto[]>>(`${this.apiUrl}/my`).pipe(
      map((response) => response.data),
    );
  }

  getOpenRequestsForStaff(): Observable<ContactRequestDto[]> {
    return this.http.get<ApiResponse<ContactRequestDto[]>>(`${this.apiUrl}/staff/open`).pipe(
      map((response) => response.data),
    );
  }

  resolve(id: number, request: ContactRequestResolveRequest): Observable<ContactRequestDto> {
    return this.http.put<ApiResponse<ContactRequestDto>>(`${this.apiUrl}/staff/${id}/resolve`, request).pipe(
      map((response) => response.data),
    );
  }
}
