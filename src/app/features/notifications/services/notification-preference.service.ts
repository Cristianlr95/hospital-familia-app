import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.models';
import {
  NotificationDto,
  NotificationPreferenceDto,
  NotificationPreferenceUpdateRequest,
} from '../models/notification-preference.models';

@Injectable({ providedIn: 'root' })
export class NotificationPreferenceService {
  private readonly http = inject(HttpClient);
  private readonly notificationsUrl = `${environment.apiUrl}/notifications`;
  private readonly preferencesUrl = `${this.notificationsUrl}/preferences`;

  getPreferences(): Observable<NotificationPreferenceDto> {
    return this.http.get<ApiResponse<NotificationPreferenceDto>>(this.preferencesUrl).pipe(
      map((response) => response.data),
    );
  }

  updatePreferences(request: NotificationPreferenceUpdateRequest): Observable<NotificationPreferenceDto> {
    return this.http.put<ApiResponse<NotificationPreferenceDto>>(this.preferencesUrl, request).pipe(
      map((response) => response.data),
    );
  }

  getNotifications(): Observable<NotificationDto[]> {
    return this.http.get<ApiResponse<NotificationDto[]>>(this.notificationsUrl).pipe(
      map((response) => response.data),
    );
  }

  markAsRead(id: number): Observable<NotificationDto> {
    return this.http.put<ApiResponse<NotificationDto>>(`${this.notificationsUrl}/${id}/read`, {}).pipe(
      map((response) => response.data),
    );
  }
}
