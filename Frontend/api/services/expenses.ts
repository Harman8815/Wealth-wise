/**
 * Expense API Services
 */
import { apiClient, PaginatedResponse } from '../client';

export interface Expense {
  id: string;
  date: string;
  category: 'Food & Dining' | 'Transportation' | 'Shopping' | 'Entertainment' | 'Bills' | 'Healthcare' | 'Other';
  amount: number;
  note: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseInput {
  date: string;
  category: Expense['category'];
  amount: number;
  note: string;
  receipt_url?: string;
}

export interface UpdateExpenseInput {
  date?: string;
  category?: Expense['category'];
  amount?: number;
  note?: string;
  receipt_url?: string;
}

export interface ExpenseSummary {
  total_amount: number;
  expense_count: number;
  by_category: Array<{
    category: string;
    total: number;
    count: number;
  }>;
}

export const expenseApi = {
  getAll: async (filters?: {
    category?: string;
    date?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const response = await apiClient.get<PaginatedResponse<Expense>>('/expenses/', {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Expense>(`/expenses/${id}/`);
    return response.data;
  },

  create: async (data: CreateExpenseInput) => {
    const response = await apiClient.post<Expense>('/expenses/', data);
    return response.data;
  },

  update: async (id: string, data: UpdateExpenseInput) => {
    const response = await apiClient.patch<Expense>(`/expenses/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/expenses/${id}/`);
  },

  getSummary: async (startDate?: string, endDate?: string) => {
    const response = await apiClient.get<ExpenseSummary>('/expenses/summary/', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  getRecent: async (days = 30, limit = 10) => {
    const response = await apiClient.get<Expense[]>('/expenses/recent/', {
      params: { days, limit },
    });
    return response.data;
  },
};
