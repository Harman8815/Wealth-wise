/**
 * API Client Configuration
 * Base axios instance with interceptors for auth and error handling
 */
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => {
        try {
          const method = response.config?.method || ''
          const isGet = method.toLowerCase() === 'get'
          const notifier = typeof window !== 'undefined' ? (window as any).wealthwiseToast : undefined

          if (!isGet) {
            const message = response.data?.message || 'Request successful'
            if (notifier) notifier({ title: message })
          }
        } catch (e) {
          // swallow notifier errors
        }

        return response
      },
      async (error: AxiosError) => {
        try {
          const notifier = typeof window !== 'undefined' ? (window as any).wealthwiseToast : undefined
          const message = error.response?.data?.detail || error.message || 'Request failed'
          if (notifier) notifier({ title: message })
        } catch (e) {
          // ignore notifier errors
        }

        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
                refresh: refreshToken,
              });
              
              const { access } = response.data;
              localStorage.setItem('access_token', access);
              
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${access}`;
              
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  get instance() {
    return this.client;
  }
}

export const apiClient = new ApiClient().instance;

// API response types
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}
