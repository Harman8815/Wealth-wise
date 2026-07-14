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

// Seeded dummy users for the development "Quick Login" feature.
export const QUICK_LOGIN_USERS = [
  { label: "User 1", email: "user1@wealthwise.test", role: "Owner @ Personal Finance" },
  { label: "User 2", email: "user2@wealthwise.test", role: "Owner @ Family Budget" },
  { label: "User 3", email: "user3@wealthwise.test", role: "Editor / Viewer" },
];

export const authApi = {
  login: async (data: LoginInput) => {
    const response = await apiClient.post<LoginResponse>('/auth/login/', data);
    return response.data;
  },

  // Development-only: credential-less login for a seeded dummy user.
  quickLogin: async (email: string) => {
    const response = await apiClient.post<LoginResponse>('/auth/quick-login/', { email });
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
