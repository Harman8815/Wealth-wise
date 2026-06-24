/**
 * API Client Configuration
 * Base axios instance with interceptors for auth and error handling
 */
"use client"

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private client: AxiosInstance;
  // Track in-flight GET requests so we can dismiss the loading toast
  // when the request completes or fails.
  private requestToastMap = new WeakMap<AxiosRequestConfig, ReturnType<typeof toast>>();

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
    // Request interceptor - add auth token and show a loading toast for GET requests.
    // We only show a loading toast for data fetches, not for mutations.
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        const method = config.method?.toLowerCase();
        if (method === 'get') {
          const loadingToast = toast({
            title: 'Loading data…',
            description: config.url ? `Fetching ${config.url}` : undefined,
            duration: 10000,
          });

          // Save the toast instance so we can dismiss it later.
          this.requestToastMap.set(config, loadingToast);
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => {
        try {
          // If a loading toast exists for this request, dismiss it now that the request completed.
          const requestToast = this.requestToastMap.get(response.config || {} as AxiosRequestConfig);
          if (requestToast) {
            requestToast.dismiss();
            this.requestToastMap.delete(response.config || {} as AxiosRequestConfig);
          }

          const method = response.config?.method || ''
          const isGet = method.toLowerCase() === 'get'
          const message = response.data?.message || 'Request successful'

          // Only show a success toast for non-GET requests, or when the API explicitly provides a message.
          const shouldNotify = !isGet || Boolean(response.data?.message)
          if (shouldNotify) {
            toast({ title: message })
          }
        } catch (e) {
          // swallow notifier errors so the request still resolves cleanly.
        }

        return response
      },
      async (error: AxiosError) => {
        try {
          const originalRequest = error.config as AxiosRequestConfig;
          const requestToast = this.requestToastMap.get(originalRequest);

          if (requestToast) {
            requestToast.dismiss();
            this.requestToastMap.delete(originalRequest);
          }

          const message = error.response?.data?.detail || error.message || 'Request failed'
          toast({ title: message, variant: 'destructive' })
        } catch (e) {
          // ignore notifier errors to avoid masking the actual request error.
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
