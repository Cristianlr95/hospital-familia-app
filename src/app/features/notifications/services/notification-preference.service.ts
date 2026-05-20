import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.models';
import { NotificationPreferenceDto, NotificationPreferenceUpdateRequest } from '../models/notification-preference.models';

@Injectable({ providedIn: 'root' })
export class NotificationPreferenceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/notifications/preferences`;

  getPreferences(): Observable<NotificationPreferenceDto> {
    return this.http.get<ApiResponse<NotificationPreferenceDto>>(this.apiUrl).pipe(
      map((response) => response.data),
    );
  }

  updatePreferences(request: NotificationPreferenceUpdateRequest): Observable<NotificationPreferenceDto> {
    return this.http.put<ApiResponse<NotificationPreferenceDto>>(this.apiUrl, request).pipe(
      map((response) => response.data),
    );
  }
}
