/**
 * Reports API Services
 * API functions for reports and scheduled reports.
 */
import { apiClient, type PaginatedResponse } from '../client';

export type ReportType =
  | 'budget_summary'
  | 'monthly_report'
  | 'category_analysis'
  | 'spending_trends'
  | 'complete';

export type ReportFrequency = 'daily' | 'weekly' | 'monthly';

export interface ScheduledReport {
  id: string;
  name: string;
  report_type: ReportType;
  frequency: ReportFrequency;
  enabled: boolean;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduledReportInput {
  name: string;
  report_type: ReportType;
  frequency: ReportFrequency;
  enabled?: boolean;
  next_run?: string;
}

export interface FilterReportsInput {
  start_date?: string;
  end_date?: string;
  categories?: string[];
  time_view?: string;
}

export interface FilterReportsResponse {
  monthly_stats: Array<{
    month: string;
    income: number;
    expense: number;
    net: number;
  }>;
  by_category: Array<{
    category: string;
    total: number;
    count: number;
  }>;
  summary: {
    income: number;
    expense: number;
    net: number;
  };
}

export const reportsApi = {
  filterReports: async (data: FilterReportsInput) => {
    const response = await apiClient.post<FilterReportsResponse>('/reports/filter/', data);
    return response.data;
  },

  exportPdf: async (filters?: { start_date?: string; end_date?: string; type?: ReportType }) => {
    const response = await apiClient.get('/reports/generate_pdf/', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  listScheduledReports: async () => {
    const response = await apiClient.get<PaginatedResponse<ScheduledReport>>('/reports/schedules/');
    return response.data;
  },

  createScheduledReport: async (data: CreateScheduledReportInput) => {
    const response = await apiClient.post<ScheduledReport>('/reports/schedules/', data);
    return response.data;
  },

  getScheduledReport: async (id: string) => {
    const response = await apiClient.get<ScheduledReport>(`/reports/schedules/${id}/`);
    return response.data;
  },

  updateScheduledReport: async (id: string, data: Partial<CreateScheduledReportInput>) => {
    const response = await apiClient.patch<ScheduledReport>(`/reports/schedules/${id}/`, data);
    return response.data;
  },

  deleteScheduledReport: async (id: string) => {
    await apiClient.delete(`/reports/schedules/${id}/`);
  },

  triggerScheduledReport: async (id: string) => {
    const response = await apiClient.get(`/reports/schedules/${id}/trigger/`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
