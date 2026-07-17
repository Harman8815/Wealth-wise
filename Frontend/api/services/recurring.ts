/**
 * Recurring Transactions API Services
 *
 * The recurring module is the foundation of a reusable scheduling platform.
 * A RecurringRule stores a generic schedule description so the same engine can
 * later power recurring budgets, subscriptions, bill reminders and EMIs.
 */
import { apiClient, PaginatedResponse } from '../client';
import type { Category } from './categories';
import type { Account } from './accounts';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type RecurringStatus = 'active' | 'paused' | 'completed';
export type RecurringType = 'income' | 'expense';

export interface RecurringRule {
  id: string;
  name: string;
  description: string;
  amount: number;
  type: RecurringType;
  category: Category | null;
  category_id?: string;
  category_name?: string;
  account: string | null;
  account_name: string;
  status: RecurringStatus;
  frequency: RecurringFrequency;
  interval: number;
  weekdays: number[];
  day_of_month: number | null;
  last_day_of_month: boolean;
  start_date: string;
  end_date: string | null;
  never_ends: boolean;
  next_execution_date: string | null;
  last_execution_date: string | null;
  execution_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringInput {
  name: string;
  description?: string;
  amount: number;
  type: RecurringType;
  category_id?: string;
  category_name?: string;
  account?: string | null;
  status?: RecurringStatus;
  frequency: RecurringFrequency;
  interval?: number;
  weekdays?: number[];
  day_of_month?: number | null;
  last_day_of_month?: boolean;
  start_date: string;
  end_date?: string | null;
  never_ends?: boolean;
}

export type UpdateRecurringInput = Partial<CreateRecurringInput>;

export interface RecurringExecution {
  id: string;
  rule: string;
  rule_name: string;
  transaction: string | null;
  scheduled_date: string;
  executed_at: string | null;
  status: 'pending' | 'executed' | 'failed' | 'skipped';
  error: string;
  created_at: string;
}

export interface RunDueSummary {
  rules_checked: number;
  executions: number;
  failed: number;
}

export interface UpcomingPreview {
  upcoming: string[];
}

export const recurringApi = {
  getAll: async (filters?: {
    type?: RecurringType;
    status?: RecurringStatus;
    frequency?: RecurringFrequency;
    search?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const { pageSize, ...rest } = filters || {};
    const response = await apiClient.get<PaginatedResponse<RecurringRule>>('/recurring/', {
      params: { ...rest, page_size: pageSize },
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<RecurringRule>(`/recurring/${id}/`);
    return response.data;
  },

  create: async (data: CreateRecurringInput) => {
    const response = await apiClient.post<RecurringRule>('/recurring/', data);
    return response.data;
  },

  update: async (id: string, data: UpdateRecurringInput) => {
    const response = await apiClient.patch<RecurringRule>(`/recurring/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/recurring/${id}/`);
  },

  pause: async (id: string) => {
    const response = await apiClient.post<RecurringRule>(`/recurring/${id}/pause/`);
    return response.data;
  },

  resume: async (id: string) => {
    const response = await apiClient.post<RecurringRule>(`/recurring/${id}/resume/`);
    return response.data;
  },

  generateNow: async (id: string) => {
    const response = await apiClient.post<{ execution: RecurringExecution; rule: RecurringRule }>(
      `/recurring/${id}/generate_now/`
    );
    return response.data;
  },

  getExecutions: async (id: string, page = 1, pageSize = 20) => {
    const response = await apiClient.get<PaginatedResponse<RecurringExecution>>(
      `/recurring/${id}/executions/`,
      { params: { page, page_size: pageSize } }
    );
    return response.data;
  },

  getUpcoming: async (id: string, count = 5) => {
    const response = await apiClient.get<UpcomingPreview>(`/recurring/${id}/upcoming/`, {
      params: { count },
    });
    return response.data;
  },

  runDue: async () => {
    const response = await apiClient.post<RunDueSummary>('/recurring/run_due/');
    return response.data;
  },
};
