/**
 * Dynamic AI Insights API services.
 * Talks to the project-scoped, dismissible insight feed.
 */
import { apiClient } from '../client';

export interface AIInsight {
  id: string;
  kind: 'spending' | 'saving' | 'investment' | 'alert' | 'goal' | 'recurring';
  title: string;
  description: string;
  severity: 'positive' | 'negative' | 'neutral';
  metadata?: {
    amount?: number;
    percentage?: number;
    category?: string;
  };
  action_url?: string;
  dismissed: boolean;
  generated_at: string;
}

export interface InsightsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AIInsight[];
}

export const insightsApi = {
  list: async () => {
    const response = await apiClient.get<InsightsListResponse>('/insights/');
    return response.data;
  },

  generate: async () => {
    const response = await apiClient.post<InsightsListResponse>('/insights/generate/');
    return response.data;
  },

  dismiss: async (id: string) => {
    const response = await apiClient.post<AIInsight>(`/insights/${id}/dismiss/`);
    return response.data;
  },
};
