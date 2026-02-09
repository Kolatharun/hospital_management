/**
 * Base API configuration for Balaji Heart Center
 * Handles JWT injection, token refresh, and error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface ApiError {
  detail: string;
  error_code?: string;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      this.setTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  private async handleTokenRefresh(): Promise<boolean> {
    if (this.isRefreshing) {
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.refreshAccessToken();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
  ): Promise<T> {
    const token = this.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - attempt token refresh
    if (response.status === 401 && retry && !endpoint.includes('/auth/')) {
      const refreshed = await this.handleTokenRefresh();
      if (refreshed) {
        return this.request<T>(endpoint, options, false);
      }
      // Token refresh failed - redirect to login
      window.dispatchEvent(new CustomEvent('auth:logout'));
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: 'An unexpected error occurred',
      }));
      throw new Error(error.detail);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
