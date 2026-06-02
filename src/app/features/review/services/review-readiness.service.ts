import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.models';
import { ReviewReadinessDto } from '../models/review-readiness.models';

@Injectable({ providedIn: 'root' })
export class ReviewReadinessService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/staff/review-readiness`;

  getCurrentReadiness(): Observable<ReviewReadinessDto> {
    return this.http.get<ApiResponse<ReviewReadinessDto>>(this.apiUrl).pipe(
      map((response) => response.data),
    );
  }
}
