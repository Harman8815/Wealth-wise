/**
 * Alert / Notification API Services
 *
 * The Notification Center is backed by the unified Alert resource. Every
 * user-facing event (financial alerts, activity, AI insights, system) is an
 * Alert with a category, priority and read/dismissed state.
 */
import { apiClient, PaginatedResponse } from '../client';

export type AlertPriority = 'critical' | 'high' | 'medium' | 'low';
export type AlertType = 'warning' | 'info' | 'success' | 'error';
export type AlertCategory =
  | 'Budget'
  | 'Bills'
  | 'Goals'
  | 'Security'
  | 'Account'
  | 'Investments'
  | 'Activity'
  | 'System'
  | 'AI';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  category: AlertCategory;
  priority: AlertPriority;
  dismissed: boolean;
  read: boolean;
  read_at?: string;
  timestamp: string;
  action_url?: string;
  created_at: string;
}

export interface CreateAlertInput {
  type: AlertType;
  title: string;
  message: string;
  category: AlertCategory;
  priority?: AlertPriority;
  action_url?: string;
}

export interface UpdateAlertInput {
  read?: boolean;
  dismissed?: boolean;
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

export interface DismissAllResult {
  status: string;
  dismissed_count: number;
}

export const alertApi = {
  getAll: async (filters?: {
    type?: string;
    category?: string;
    priority?: string;
    read?: boolean;
    dismissed?: boolean;
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

  markDismissed: async (id: string) => {
    const response = await apiClient.post<{ status: string; dismissed: boolean }>(`/alerts/${id}/mark_dismissed/`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await apiClient.post<{ status: string; marked_count: number }>('/alerts/mark_all_read/');
    return response.data;
  },

  dismissAll: async () => {
    const response = await apiClient.post<DismissAllResult>('/alerts/dismiss_all/');
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

  generate: async () => {
    const response = await apiClient.post<{ generated: number }>('/alerts/generate/');
    return response.data;
  },
};
