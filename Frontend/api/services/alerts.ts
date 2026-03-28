/**
 * Alert API Services
 */
import { apiClient, PaginatedResponse } from '../client';

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  category: 'Budget' | 'Bills' | 'Goals' | 'Security' | 'Account' | 'Investments';
  read: boolean;
  read_at?: string;
  timestamp: string;
  action_url?: string;
  created_at: string;
}

export interface CreateAlertInput {
  type: Alert['type'];
  title: string;
  message: string;
  category: Alert['category'];
  action_url?: string;
}

export interface UpdateAlertInput {
  read?: boolean;
}

export interface UnreadCount {
  unread_count: number;
  total_count: number;
}

export interface CategoryCount {
  category: string;
  unread: number;
  total: number;
}

export const alertApi = {
  getAll: async (filters?: {
    type?: string;
    category?: string;
    read?: boolean;
    page?: number;
    pageSize?: number;
  }) => {
    const response = await apiClient.get<PaginatedResponse<Alert>>('/alerts/', {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Alert>(`/alerts/${id}/`);
    return response.data;
  },

  create: async (data: CreateAlertInput) => {
    const response = await apiClient.post<Alert>('/alerts/', data);
    return response.data;
  },

  update: async (id: string, data: UpdateAlertInput) => {
    const response = await apiClient.patch<Alert>(`/alerts/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/alerts/${id}/`);
  },

  markRead: async (id: string) => {
    const response = await apiClient.post<{ status: string; read: boolean }>(`/alerts/${id}/mark_read/`);
    return response.data;
  },

  markUnread: async (id: string) => {
    const response = await apiClient.post<{ status: string; read: boolean }>(`/alerts/${id}/mark_unread/`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await apiClient.post<{ status: string; marked_count: number }>('/alerts/mark_all_read/');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get<UnreadCount>('/alerts/unread_count/');
    return response.data;
  },

  getByCategory: async () => {
    const response = await apiClient.get<CategoryCount[]>('/alerts/by_category/');
    return response.data;
  },
};
