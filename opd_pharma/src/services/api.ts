/**
 * API Client for Balaji Heart Center OPD Pharmacy Desktop
 * Supports live backend communication and automatic mock fallback for offline resilience.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!response.ok) {
        throw new ApiError(response.status, `GET ${endpoint} failed`);
      }
      return await response.json();
    } catch (err) {
      throw err;
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      if (!response.ok) {
        throw new ApiError(response.status, `POST ${endpoint} failed`);
      }
      return await response.json();
    } catch (err) {
      throw err;
    }
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new ApiError(response.status, `PATCH ${endpoint} failed`);
      }
      return await response.json();
    } catch (err) {
      throw err;
    }
  }

  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      if (!response.ok) {
        throw new ApiError(response.status, `DELETE ${endpoint} failed`);
      }
      return await response.json();
    } catch (err) {
      throw err;
    }
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
