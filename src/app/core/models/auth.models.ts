export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetRequestResponse {
  accepted: boolean;
  devResetToken?: string | null;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface UserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  roles: string[];
}

export interface LoginResponse {
  tokenType: 'Bearer';
  accessToken: string;
  refreshToken: string;
  expiresInMs: number;
  user: UserDto;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface AuthSessionItemDto {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  revokedAt?: string | null;
  revoked: boolean;
  current: boolean;
}

export interface RevokeOtherSessionsRequest {
  refreshToken: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}
