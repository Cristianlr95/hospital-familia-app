import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.models';
import {
  PatientEventCreateRequest,
  PatientEventDto,
  PatientEventRange,
  PatientEventStatus,
} from '../models/patient-event.models';

@Injectable({ providedIn: 'root' })
export class PatientEventService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly eventCache = new Map<string, Observable<PatientEventDto[]>>();

  getUpcomingEventsForTutor(
    patientPublicId: string,
    range?: PatientEventRange,
  ): Observable<PatientEventDto[]> {
    return this.cachedEvents(`tutor:${patientPublicId}:${this.rangeKey(range)}`, () => this.http.get<ApiResponse<PatientEventDto[]>>(
      `${this.apiUrl}/patients/${patientPublicId}/events`,
      { params: this.rangeParams(range) },
    ).pipe(
      map((response) => response.data),
    ));
  }

  getEventsForStaff(patientPublicId: string, range?: PatientEventRange): Observable<PatientEventDto[]> {
    return this.cachedEvents(`staff:${patientPublicId}:${this.rangeKey(range)}`, () => this.http.get<ApiResponse<PatientEventDto[]>>(
      `${this.apiUrl}/events/patient/${patientPublicId}`,
      { params: this.rangeParams(range) },
    ).pipe(
      map((response) => response.data),
    ));
  }

  createEvent(request: PatientEventCreateRequest): Observable<PatientEventDto> {
    return this.http.post<ApiResponse<PatientEventDto>>(`${this.apiUrl}/events`, request).pipe(
      map((response) => response.data),
      tap(() => this.invalidatePatient(request.patientPublicId)),
    );
  }

  changeStatus(id: number, status: PatientEventStatus): Observable<PatientEventDto> {
    return this.http.put<ApiResponse<PatientEventDto>>(`${this.apiUrl}/events/${id}/status`, { status }).pipe(
      map((response) => response.data),
      tap((event) => this.invalidatePatient(event.patientPublicId)),
    );
  }

  clearCache(): void {
    this.eventCache.clear();
  }

  private cachedEvents(
    key: string,
    requestFactory: () => Observable<PatientEventDto[]>,
  ): Observable<PatientEventDto[]> {
    const cached = this.eventCache.get(key);
    if (cached) {
      return cached;
    }

    const request = requestFactory().pipe(
      catchError((error) => {
        this.eventCache.delete(key);
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.eventCache.set(key, request);
    return request;
  }

  private invalidatePatient(patientPublicId: string): void {
    for (const key of this.eventCache.keys()) {
      if (key.includes(`:${patientPublicId}:`)) {
        this.eventCache.delete(key);
      }
    }
  }

  private rangeKey(range?: PatientEventRange): string {
    return range ? `${range.from}/${range.to}` : 'default';
  }

  private rangeParams(range?: PatientEventRange): HttpParams {
    if (!range) {
      return new HttpParams();
    }

    return new HttpParams()
      .set('from', range.from)
      .set('to', range.to);
  }
}
