import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.models';
import { ActivityFeedItemDto } from '../models/activity-feed.models';

@Injectable({ providedIn: 'root' })
export class ActivityFeedService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/activity`;

  getTutorFeed(): Observable<ActivityFeedItemDto[]> {
    return this.http.get<ApiResponse<ActivityFeedItemDto[]>>(`${this.apiUrl}/tutor`).pipe(
      map((response) => response.data),
    );
  }

  getStaffFeed(): Observable<ActivityFeedItemDto[]> {
    return this.http.get<ApiResponse<ActivityFeedItemDto[]>>(`${this.apiUrl}/staff`).pipe(
      map((response) => response.data),
    );
  }
}
