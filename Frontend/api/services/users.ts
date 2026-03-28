/**
 * User API Services
 * API functions for user management
 */
import { apiClient, ApiResponse, PaginatedResponse } from '../client';

export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  language: string;
  theme: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  currency?: string;
  language?: string;
  theme?: string;
}

export const userApi = {
  // Get all users
  getAll: async (page = 1, pageSize = 20) => {
    const response = await apiClient.get<PaginatedResponse<User>>('/users/', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  // Get user by ID
  getById: async (id: string) => {
    const response = await apiClient.get<User>(`/users/${id}/`);
    return response.data;
  },

  // Get current user (me)
  getMe: async () => {
    const response = await apiClient.get<User>('/users/me/');
    return response.data;
  },

  // Create user
  create: async (data: CreateUserInput) => {
    const response = await apiClient.post<User>('/users/', data);
    return response.data;
  },

  // Update user
  update: async (id: string, data: UpdateUserInput) => {
    const response = await apiClient.patch<User>(`/users/${id}/`, data);
    return response.data;
  },

  // Delete user
  delete: async (id: string) => {
    await apiClient.delete(`/users/${id}/`);
  },
};
