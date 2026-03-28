/**
 * Alert Settings API Services
 */
import { apiClient, PaginatedResponse } from '../client';

export interface AlertSetting {
  id: string;
  setting_id: string;
  title: string;
  description: string;
  category: 'Budget' | 'Bills' | 'Goals' | 'Security' | 'Account' | 'Investments';
  enabled: boolean;
  threshold?: number;
  threshold_unit?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAlertSettingInput {
  setting_id: string;
  title: string;
  description?: string;
  category: AlertSetting['category'];
  enabled?: boolean;
  threshold?: number;
  threshold_unit?: string;
}

export interface UpdateAlertSettingInput {
  title?: string;
  description?: string;
  enabled?: boolean;
  threshold?: number;
  threshold_unit?: string;
}

export interface AlertSettingSummary {
  total_settings: number;
  enabled_count: number;
  disabled_count: number;
  by_category: Record<string, { enabled: number; disabled: number; total: number }>;
}

export const alertSettingApi = {
  getAll: async (filters?: {
    category?: string;
    enabled?: boolean;
    page?: number;
    pageSize?: number;
  }) => {
    const response = await apiClient.get<PaginatedResponse<AlertSetting>>('/alert-settings/', {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<AlertSetting>(`/alert-settings/${id}/`);
    return response.data;
  },

  create: async (data: CreateAlertSettingInput) => {
    const response = await apiClient.post<AlertSetting>('/alert-settings/', data);
    return response.data;
  },

  update: async (id: string, data: UpdateAlertSettingInput) => {
    const response = await apiClient.patch<AlertSetting>(`/alert-settings/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/alert-settings/${id}/`);
  },

  toggle: async (id: string) => {
    const response = await apiClient.post<AlertSetting>(`/alert-settings/${id}/toggle/`);
    return response.data;
  },

  resetDefaults: async () => {
    const response = await apiClient.post<AlertSetting[]>('/alert-settings/reset_defaults/');
    return response.data;
  },

  getSummary: async () => {
    const response = await apiClient.get<AlertSettingSummary>('/alert-settings/summary/');
    return response.data;
  },
};
