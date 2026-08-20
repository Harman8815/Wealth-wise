/**
 * ML feature API services.
 */
import { apiClient } from '../client';

export interface Anomaly {
  index: number;
  score: number;
  threshold: number;
  is_anomaly: boolean;
  transaction_id: string;
  date: string;
  description: string;
  amount: number;
}

export interface AnomaliesResponse {
  count: number;
  anomalies: Anomaly[];
}

export interface ProphetForecastPoint {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

export interface LstmForecast {
  forecast: number[];
  lookback: number;
}

export interface ForecastResponse {
  prophet: ProphetForecastPoint[] | null;
  lstm: LstmForecast | null;
  csv_data: any[] | null;
}

export interface MerchantCluster {
  merchant: string;
  total_spend: number;
  avg_spend: number;
  transaction_count: number;
  std_spend: number;
  first_seen: string;
  last_seen: string;
  cluster: number;
}

export interface ClustersResponse {
  clusters: MerchantCluster[];
  profiles: any[];
  metadata: Record<string, any>;
}

export interface BudgetForecastItem {
  category: string;
  current_spent: number;
  budget: number;
  monthly_average: number;
  forecast: { month: number; predicted_spend: number; budget: number | null }[];
}

export interface BudgetForecastResponse {
  forecasts: BudgetForecastItem[];
}

export const mlApi = {
  getAnomalies: async () => {
    const response = await apiClient.get<AnomaliesResponse>('/ml/anomalies/');
    return response.data;
  },

  getForecast: async () => {
    const response = await apiClient.get<ForecastResponse>('/ml/forecast/');
    return response.data;
  },

  getClusters: async () => {
    const response = await apiClient.get<ClustersResponse>('/ml/clusters/');
    return response.data;
  },

  getBudgetForecast: async () => {
    const response = await apiClient.get<BudgetForecastResponse>('/ml/budget-forecast/');
    return response.data;
  },
};
