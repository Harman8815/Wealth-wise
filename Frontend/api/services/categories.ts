/**
 * Category API Services
 */
import { apiClient, PaginatedResponse } from '@/api/client';

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income' | 'goal' | 'budget';
  color: string;
  text_color: string;
  icon: string;
  symbol: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryInput {
  name: string;
  type?: 'expense' | 'income' | 'goal' | 'budget';
  color?: string;
  text_color?: string;
  icon?: string;
  symbol?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  type?: 'expense' | 'income' | 'goal' | 'budget';
  color?: string;
  text_color?: string;
  icon?: string;
  symbol?: string;
}

export const categoryApi = {
  getAll: async (page = 1, pageSize = 20, type?: string) => {
    const response = await apiClient.get<PaginatedResponse<Category>>('/categories/', {
      params: { page, page_size: pageSize, type },
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Category>(`/categories/${id}/`);
    return response.data;
  },

  search: async (query: string, type?: string) => {
    const response = await apiClient.get<Category[]>('/categories/search/', {
      params: { q: query, type },
    });
    return response.data;
  },

  create: async (data: CreateCategoryInput) => {
    const response = await apiClient.post<Category>('/categories/', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCategoryInput) => {
    const response = await apiClient.patch<Category>(`/categories/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/categories/${id}/`);
  },

  getDefaults: async () => {
    const response = await apiClient.get<Category[]>('/categories/defaults/');
    return response.data;
  },
};
