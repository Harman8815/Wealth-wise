/**
 * Account API Services
 * API functions for financial account management
 */
import { apiClient, PaginatedResponse } from '../client';

export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'credit_card' | 'debit_card' | 'wallet' | 'cash';
  balance: number;
  currency: string;
  is_active: boolean;
  bank_name: string;
  account_number?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountInput {
  name: string;
  type: Account['type'];
  balance?: number;
  bank_name?: string;
  account_number?: string;
}

export interface UpdateAccountInput {
  name?: string;
  balance?: number;
  is_active?: boolean;
  bank_name?: string;
  account_number?: string;
}

export interface AccountSummary {
  total_balance: number;
  account_count: number;
  by_type: Record<string, { count: number; balance: number }>;
}

export const accountApi = {
  getAll: async (page = 1, pageSize = 20) => {
    const response = await apiClient.get<PaginatedResponse<Account>>('/accounts/', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Account>(`/accounts/${id}/`);
    return response.data;
  },

  create: async (data: CreateAccountInput) => {
    const response = await apiClient.post<Account>('/accounts/', data);
    return response.data;
  },

  update: async (id: string, data: UpdateAccountInput) => {
    const response = await apiClient.patch<Account>(`/accounts/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/accounts/${id}/`);
  },

  getSummary: async () => {
    const response = await apiClient.get<AccountSummary>('/accounts/summary/');
    return response.data;
  },

  toggleActive: async (id: string) => {
    const response = await apiClient.post<Account>(`/accounts/${id}/toggle_active/`);
    return response.data;
  },
};
