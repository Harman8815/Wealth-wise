/**
 * Auth API Services
 */
import { apiClient } from '../client';
import { User } from './users';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RefreshResponse {
  access: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export const authApi = {
  login: async (data: LoginInput) => {
    const response = await apiClient.post<LoginResponse>('/auth/login/', data);
    return response.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await apiClient.post<RefreshResponse>('/auth/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },

  register: async (data: RegisterInput) => {
    const response = await apiClient.post<User>('/users/', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};
