/**
 * Authentication Service - API calls for auth
 * Matches backend auth schema structure
 */

import api from './api';

export type UserRole = 'front-office' | 'doctor';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserResponse {
  id: string;
  username: string;
  display_name: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  last_login: string | null;
  doctor_id: string | null;
}

export interface LoginResponse {
  tokens: TokenResponse;
  user: UserResponse;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);

    // Store tokens in localStorage
    localStorage.setItem('access_token', response.tokens.access_token);
    localStorage.setItem('refresh_token', response.tokens.refresh_token);

    return response;
  },

  async getCurrentUser(): Promise<UserResponse> {
    return api.get<UserResponse>('/auth/me');
  },

  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });

    localStorage.setItem('access_token', response.access_token);
    if (response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token);
    }

    return response;
  },

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  getStoredToken(): string | null {
    return localStorage.getItem('access_token');
  },
};

export default authService;
