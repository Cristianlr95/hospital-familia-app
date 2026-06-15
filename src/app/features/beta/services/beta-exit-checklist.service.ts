import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.models';
import { BetaExitCheckUpdateRequest, BetaExitChecklistDto } from '../models/beta-exit-checklist.models';

@Injectable({ providedIn: 'root' })
export class BetaExitChecklistService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/staff/beta-exit-checklist`;

  getChecklist(): Observable<BetaExitChecklistDto> {
    return this.http.get<ApiResponse<BetaExitChecklistDto>>(this.apiUrl).pipe(
      map((response) => response.data),
    );
  }

  updateCheck(id: number, request: BetaExitCheckUpdateRequest): Observable<BetaExitChecklistDto> {
    return this.http.put<ApiResponse<BetaExitChecklistDto>>(`${this.apiUrl}/${id}`, request).pipe(
      map((response) => response.data),
    );
  }
}
