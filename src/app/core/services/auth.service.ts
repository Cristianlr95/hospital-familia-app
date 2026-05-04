import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, AuthSession, LoginRequest, LoginResponse, RegisterRequest, UserDto } from '../models/auth.models';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly apiUrl = environment.apiUrl;
  private readonly currentUserSubject = new BehaviorSubject<UserDto | null>(this.storage.getUser());

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

  validateSession(): Observable<UserDto> {
    return this.http.get<ApiResponse<UserDto>>(`${this.apiUrl}/auth/validate`).pipe(
      map((response) => response.data),
      tap((user) => this.currentUserSubject.next(user)),
    );
  }

  logout(): void {
    this.storage.clearSession();
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return Boolean(this.storage.getAccessToken());
  }

  getAccessToken(): string | null {
    return this.storage.getAccessToken();
  }

  getCurrentUser(): UserDto | null {
    return this.currentUserSubject.value;
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
}
