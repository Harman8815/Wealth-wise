/**
 * Financial Health Score API services.
 * Talks to the project-scoped explainable scoring engine.
 */
import { apiClient } from '../client';

export interface HealthDimension {
  key: string;
  label: string;
  raw_metrics: Record<string, unknown>;
  normalized_score: number;
  weight: number;
  contribution: number;
  explanation: string;
  recommendations: Array<{
    title: string;
    detail: string;
    estimated_improvement: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface FinancialHealthSnapshot {
  id: string;
  score: number;
  grade: string;
  grade_label: string;
  previous_score: number | null;
  trend: 'up' | 'down' | 'flat';
  dimensions: HealthDimension[];
  strengths: Array<{ dimension: string; label: string; score: number; explanation: string }>;
  risks: Array<{ dimension: string; label: string; score: number; explanation: string }>;
  period_start: string | null;
  period_end: string | null;
  computed_at: string;
  created_at: string;
}

export interface HealthRecommendation {
  id: string;
  dimension: string;
  label: string;
  title: string;
  detail: string;
  estimated_improvement: number;
  priority: 'high' | 'medium' | 'low';
  resolved: boolean;
  created_at: string;
}

export interface HealthReport {
  snapshot: FinancialHealthSnapshot;
  recommendations: HealthRecommendation[];
  estimated_improvement: number;
  previous_score: number | null;
}

export interface DimensionConfig {
  dimension: string;
  label: string;
  weight: number;
  enabled: boolean;
}

export interface HealthConfig {
  dimensions: DimensionConfig[];
}

export const financialHealthApi = {
  getCurrent: async () => {
    const response = await apiClient.get<FinancialHealthSnapshot>('/financial-health/current/');
    return response.data;
  },

  getHistory: async () => {
    const response = await apiClient.get<{ results: FinancialHealthSnapshot[] } | FinancialHealthSnapshot[]>(
      '/financial-health/history/'
    );
    return response.data;
  },

  getReport: async () => {
    const response = await apiClient.get<HealthReport>('/financial-health/report/');
    return response.data;
  },

  recompute: async () => {
    const response = await apiClient.post<FinancialHealthSnapshot>('/financial-health/recompute/');
    return response.data;
  },

  getConfig: async () => {
    const response = await apiClient.get<HealthConfig>('/financial-health/config/');
    return response.data;
  },

  updateConfig: async (weights: Record<string, { weight: number; enabled: boolean }>) => {
    const response = await apiClient.put<HealthConfig>('/financial-health/config/', { weights });
    return response.data;
  },
};
