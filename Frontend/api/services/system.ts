import { apiClient } from '../client';

export interface DefaultUserResponse {
  email: string;
  password: string;
  created: boolean;
  message: string;
}

export interface SeedDataResponse {
  status: string;
  message: string;
  data: {
    accounts_created: number;
    budget_categories_created: number;
    goals_created: number;
    transactions_created: number;
    alerts_created: number;
  };
}

export const systemApi = {
  getDefaultUser: async () => {
    const response = await apiClient.get<DefaultUserResponse>('/default-user/');
    return response.data;
  },

  seedHistoricalData: async (years: number = 5) => {
    const response = await apiClient.post<SeedDataResponse>('/seed-data/', { years });
    return response.data;
  },
};
