import { Injectable } from '@angular/core';
import { AuthSession, UserDto } from '../models/auth.models';

const ACCESS_TOKEN_KEY = 'hf_access_token';
const REFRESH_TOKEN_KEY = 'hf_refresh_token';
const USER_KEY = 'hf_user';

@Injectable({ providedIn: 'root' })
export class StorageService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getUser(): UserDto | null {
    const rawUser = localStorage.getItem(USER_KEY);
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as UserDto;
    } catch {
      this.clearSession();
      return null;
    }
  }

  saveSession(session: AuthSession): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  }

  saveUser(user: UserDto): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
