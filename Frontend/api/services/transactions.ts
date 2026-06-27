/**
 * Transaction API Services
 * API functions for transaction management
 */
import { apiClient, PaginatedResponse } from '../client';

export interface Transaction {
  id: string;
  account: string;
  account_name: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'completed' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionInput {
  account: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  status?: 'completed' | 'pending';
}

export interface UpdateTransactionInput {
  account?: string;
  date?: string;
  description?: string;
  category?: string;
  amount?: number;
  type?: 'income' | 'expense';
  status?: 'completed' | 'pending';
}

export interface TransactionSummary {
  income: number;
  expense: number;
  net: number;
  transaction_count: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
}

export interface MonthlyStats {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export const transactionApi = {
  getAll: async (filters?: {
    category?: string;
    type?: 'income' | 'expense';
    status?: 'completed' | 'pending';
    date?: string;
    page?: number;
    pageSize?: number;
    ordering?: string;
    search?: string;
  }) => {
    const { pageSize, search, ...rest } = filters || {};
    const response = await apiClient.get<PaginatedResponse<Transaction>>('/transactions/', {
      params: {
        ...rest,
        ...(pageSize ? { page_size: pageSize } : {}),
        ...(search ? { search } : {}),
      },
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Transaction>(`/transactions/${id}/`);
    return response.data;
  },

  create: async (data: CreateTransactionInput) => {
    const response = await apiClient.post<Transaction>('/transactions/', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTransactionInput) => {
    const response = await apiClient.patch<Transaction>(`/transactions/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/transactions/${id}/`);
  },

  getSummary: async (startDate?: string, endDate?: string) => {
    const response = await apiClient.get<TransactionSummary>('/transactions/summary/', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  getByCategory: async () => {
    const response = await apiClient.get<CategoryBreakdown[]>('/transactions/by_category/');
    return response.data;
  },

  getMonthlyStats: async (months = 12) => {
    const response = await apiClient.get<MonthlyStats[]>('/transactions/monthly_stats/', {
      params: { months },
    });
    return response.data;
  },
};
