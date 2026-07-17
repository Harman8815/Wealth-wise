/**
 * Recurring Budgets API Services
 *
 * The recurring-budgets module automatically generates future budgets from a
 * reusable template, reusing the same scheduling platform that powers recurring
 * transactions. A RecurringBudget stores a generic schedule plus a
 * category-allocation template; when a period begins the engine materialises a
 * set of concrete budget categories.
 */
import { apiClient, PaginatedResponse } from '../client';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type RecurringStatus = 'active' | 'paused' | 'completed';
export type BudgetStrategy =
  | 'copy_exact'
  | 'copy_structure'
  | 'reset_spent'
  | 'carry_forward'
  | 'increase_percent'
  | 'decrease_percent'
  | 'auto_adjust';

export interface BudgetAllocation {
  name: string;
  budgeted: number;
  spent?: number;
  color?: string;
  symbol?: string;
  category?: string;
}

export interface RecurringBudget {
  id: string;
  name: string;
  description: string;
  total_budget: number;
  categories: BudgetAllocation[];
  strategy: BudgetStrategy;
  adjustment_percent: number;
  auto_carry_forward: boolean;
  auto_adjust_previous: boolean;
  status: RecurringStatus;
  frequency: RecurringFrequency;
  interval: number;
  weekdays: number[];
  day_of_month: number | null;
  last_day_of_month: boolean;
  start_date: string;
  end_date: string | null;
  never_ends: boolean;
  next_generation_date: string | null;
  last_generation_date: string | null;
  generation_count: number;
  anchor_budget: string | null;
  anchor_budget_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringBudgetInput {
  name: string;
  description?: string;
  total_budget: number;
  categories: BudgetAllocation[];
  strategy: BudgetStrategy;
  adjustment_percent?: number;
  auto_carry_forward?: boolean;
  auto_adjust_previous?: boolean;
  status?: RecurringStatus;
  frequency: RecurringFrequency;
  interval?: number;
  weekdays?: number[];
  day_of_month?: number | null;
  last_day_of_month?: boolean;
  start_date: string;
  end_date?: string | null;
  never_ends?: boolean;
  anchor_budget?: string | null;
}

export type UpdateRecurringBudgetInput = Partial<CreateRecurringBudgetInput>;

export interface RecurringBudgetExecution {
  id: string;
  rule: string;
  rule_name: string;
  generated_budgets: Array<{
    id: string;
    name: string;
    budgeted: number;
    spent: number;
  }>;
  scheduled_date: string;
  executed_at: string | null;
  status: 'pending' | 'generated' | 'failed' | 'skipped';
  error: string;
  created_at: string;
}

export interface RunDueBudgetSummary {
  rules_checked: number;
  generations: number;
  failed: number;
}

export interface UpcomingPreview {
  upcoming: string[];
}

export const recurringBudgetApi = {
  getAll: async (filters?: {
    status?: RecurringStatus;
    frequency?: RecurringFrequency;
    strategy?: BudgetStrategy;
    search?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const { pageSize, ...rest } = filters || {};
    const response = await apiClient.get<PaginatedResponse<RecurringBudget>>('/recurring-budgets/', {
      params: { ...rest, page_size: pageSize },
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<RecurringBudget>(`/recurring-budgets/${id}/`);
    return response.data;
  },

  create: async (data: CreateRecurringBudgetInput) => {
    const response = await apiClient.post<RecurringBudget>('/recurring-budgets/', data);
    return response.data;
  },

  update: async (id: string, data: UpdateRecurringBudgetInput) => {
    const response = await apiClient.patch<RecurringBudget>(`/recurring-budgets/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/recurring-budgets/${id}/`);
  },

  pause: async (id: string) => {
    const response = await apiClient.post<RecurringBudget>(`/recurring-budgets/${id}/pause/`);
    return response.data;
  },

  resume: async (id: string) => {
    const response = await apiClient.post<RecurringBudget>(`/recurring-budgets/${id}/resume/`);
    return response.data;
  },

  generateNow: async (id: string) => {
    const response = await apiClient.post<{ execution: RecurringBudgetExecution; rule: RecurringBudget }>(
      `/recurring-budgets/${id}/generate_now/`
    );
    return response.data;
  },

  getExecutions: async (id: string, page = 1, pageSize = 20) => {
    const response = await apiClient.get<PaginatedResponse<RecurringBudgetExecution>>(
      `/recurring-budgets/${id}/executions/`,
      { params: { page, page_size: pageSize } }
    );
    return response.data;
  },

  getUpcoming: async (id: string, count = 5) => {
    const response = await apiClient.get<UpcomingPreview>(`/recurring-budgets/${id}/upcoming/`, {
      params: { count },
    });
    return response.data;
  },

  runDue: async () => {
    const response = await apiClient.post<RunDueBudgetSummary>('/recurring-budgets/run_due/');
    return response.data;
  },
};
