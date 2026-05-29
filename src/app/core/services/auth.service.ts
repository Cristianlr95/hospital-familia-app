import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  AuthSession,
  AuthSessionItemDto,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  PasswordResetRequestResponse,
  RegisterRequest,
  RevokeOtherSessionsRequest,
  UserDto,
  UserProfileUpdateRequest,
} from '../models/auth.models';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly apiUrl = environment.apiUrl;
  private readonly currentUserSubject = new BehaviorSubject<UserDto | null>(this.storage.getUser());
  private refreshRequest$: Observable<LoginResponse> | null = null;

  readonly currentUser$ = this.currentUserSubject.asObservable();

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/auth/login`, request).pipe(
      map((response) => response.data),
      tap((data) => this.storeLoginResponse(data)),
    );
  }

  register(request: RegisterRequest): Observable<UserDto> {
    return this.http.post<ApiResponse<UserDto>>(`${this.apiUrl}/auth/register`, request).pipe(
      map((response) => response.data),
    );
  }

  requestPasswordReset(request: PasswordResetRequest): Observable<PasswordResetRequestResponse> {
    return this.http.post<ApiResponse<PasswordResetRequestResponse>>(`${this.apiUrl}/auth/password-reset/request`, request).pipe(
      map((response) => response.data),
    );
  }

  confirmPasswordReset(request: PasswordResetConfirmRequest): Observable<void> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/auth/password-reset/confirm`, request).pipe(
      map(() => void 0),
    );
  }

  validateSession(): Observable<UserDto> {
    return this.http.get<ApiResponse<UserDto>>(`${this.apiUrl}/auth/validate`).pipe(
      map((response) => response.data),
      tap((user) => this.storeUser(user)),
    );
  }

  updateProfile(request: UserProfileUpdateRequest): Observable<UserDto> {
    return this.http.put<ApiResponse<UserDto>>(`${this.apiUrl}/auth/profile`, request).pipe(
      map((response) => response.data),
      tap((user) => this.storeUser(user)),
    );
  }

  refreshSession(): Observable<LoginResponse> {
    const refreshToken = this.storage.getRefreshToken();
    if (!refreshToken) {
      this.clearLocalSession();
      return throwError(() => new Error('No hay refresh token disponible'));
    }

    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    const request = { refreshToken };
    this.refreshRequest$ = this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/auth/refresh`, request).pipe(
      map((response) => response.data),
      tap((data) => this.storeLoginResponse(data)),
      finalize(() => {
        this.refreshRequest$ = null;
      }),
      shareReplay(1),
      catchError((error) => {
        this.clearLocalSession();
        return throwError(() => error);
      }),
    );

    return this.refreshRequest$;
  }

  getSessions(): Observable<AuthSessionItemDto[]> {
    return this.http.get<ApiResponse<AuthSessionItemDto[]>>(`${this.apiUrl}/auth/sessions`).pipe(
      map((response) => response.data),
    );
  }

  revokeSession(sessionId: string): Observable<void> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/auth/sessions/${sessionId}/revoke`, {}).pipe(
      map(() => void 0),
    );
  }

  revokeOtherSessions(): Observable<void> {
    const refreshToken = this.storage.getRefreshToken();
    if (!refreshToken) {
      return of(void 0);
    }

    const request: RevokeOtherSessionsRequest = { refreshToken };
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/auth/sessions/revoke-others`, request).pipe(
      map(() => void 0),
    );
  }

  logout(): Observable<void> {
    const refreshToken = this.storage.getRefreshToken();
    if (!refreshToken) {
      this.clearLocalSession();
      return of(void 0);
    }

    const request: LogoutRequest = { refreshToken };
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/auth/logout`, request).pipe(
      tap(() => this.clearLocalSession()),
      map(() => void 0),
      catchError(() => {
        this.clearLocalSession();
        return of(void 0);
      }),
    );
  }

  isAuthenticated(): boolean {
    return Boolean(this.storage.getAccessToken());
  }

  getAccessToken(): string | null {
    return this.storage.getAccessToken();
  }

  getRefreshToken(): string | null {
    return this.storage.getRefreshToken();
  }

  getCurrentUser(): UserDto | null {
    return this.currentUserSubject.value;
  }

  clearSession(): void {
    this.clearLocalSession();
  }

  private storeLoginResponse(data: LoginResponse): void {
    const session: AuthSession = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    };

    this.storage.saveSession(session);
    this.currentUserSubject.next(data.user);
  }

  private storeUser(user: UserDto): void {
    this.storage.saveUser(user);
    this.currentUserSubject.next(user);
  }

  private clearLocalSession(): void {
    this.storage.clearSession();
    this.currentUserSubject.next(null);
  }
}
