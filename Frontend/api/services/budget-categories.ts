/**
 * Budget Category API Services
 */
import { apiClient, PaginatedResponse } from '../client';

export interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetCategoryInput {
  name: string;
  budgeted: number;
  color: string;
  icon?: string;
}

export interface UpdateBudgetCategoryInput {
  name?: string;
  budgeted?: number;
  color?: string;
  icon?: string;
}

export interface BudgetOverview {
  total_budgeted: number;
  total_spent: number;
  total_remaining: number;
  overall_percentage: number;
  categories: Array<{
    id: string;
    name: string;
    budgeted: number;
    spent: number;
    remaining: number;
    percentage_used: number;
    color: string;
    icon: string;
  }>;
}

export const budgetCategoryApi = {
  getAll: async (page = 1, pageSize = 20) => {
    const response = await apiClient.get<PaginatedResponse<BudgetCategory>>('/budget-categories/', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<BudgetCategory>(`/budget-categories/${id}/`);
    return response.data;
  },

  create: async (data: CreateBudgetCategoryInput) => {
    const response = await apiClient.post<BudgetCategory>('/budget-categories/', data);
    return response.data;
  },

  update: async (id: string, data: UpdateBudgetCategoryInput) => {
    const response = await apiClient.patch<BudgetCategory>(`/budget-categories/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/budget-categories/${id}/`);
  },

  updateSpent: async (id: string) => {
    const response = await apiClient.post<BudgetCategory>(`/budget-categories/${id}/update_spent/`);
    return response.data;
  },

  getOverview: async () => {
    const response = await apiClient.get<BudgetOverview>('/budget-categories/overview/');
    return response.data;
  },
};
