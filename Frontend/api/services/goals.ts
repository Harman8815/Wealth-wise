/**
 * Goal API Services
 */
import { apiClient, PaginatedResponse } from '../client';

export interface Goal {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: 'Emergency' | 'Travel' | 'Technology' | 'Transportation' | 'Education' | 'Investment' | 'Other';
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'completed' | 'paused';
  percentage_complete: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  target_amount: number;
  current_amount?: number;
  target_date: string;
  category: Goal['category'];
  priority: Goal['priority'];
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  target_amount?: number;
  current_amount?: number;
  target_date?: string;
  category?: Goal['category'];
  priority?: Goal['priority'];
  status?: Goal['status'];
}

export interface GoalProgress {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  paused_goals: number;
  total_target: number;
  total_saved: number;
  total_remaining: number;
  overall_percentage: number;
}

export const goalApi = {
  getAll: async (filters?: {
    category?: string;
    priority?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const response = await apiClient.get<PaginatedResponse<Goal>>('/goals/', {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Goal>(`/goals/${id}/`);
    return response.data;
  },

  create: async (data: CreateGoalInput) => {
    const response = await apiClient.post<Goal>('/goals/', data);
    return response.data;
  },

  update: async (id: string, data: UpdateGoalInput) => {
    const response = await apiClient.patch<Goal>(`/goals/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/goals/${id}/`);
  },

  contribute: async (id: string, amount: number) => {
    const response = await apiClient.post<Goal>(`/goals/${id}/contribute/`, { amount });
    return response.data;
  },

  toggleStatus: async (id: string) => {
    const response = await apiClient.post<Goal>(`/goals/${id}/toggle_status/`);
    return response.data;
  },

  getProgress: async () => {
    const response = await apiClient.get<GoalProgress>('/goals/progress/');
    return response.data;
  },
};
