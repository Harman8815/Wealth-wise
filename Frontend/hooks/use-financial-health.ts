/**
 * Financial Health Score hooks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financialHealthApi, type HealthConfig, type DimensionConfig } from '@/api/services';
import { queryKeys } from '@/api/query-client';
import { toast } from 'sonner';

export const useFinancialHealth = () => {
  return useQuery({
    queryKey: queryKeys.financialHealth.current,
    queryFn: financialHealthApi.getCurrent,
  });
};

export const useFinancialHealthHistory = () => {
  return useQuery({
    queryKey: queryKeys.financialHealth.history,
    queryFn: financialHealthApi.getHistory,
  });
};

export const useFinancialHealthReport = () => {
  return useQuery({
    queryKey: queryKeys.financialHealth.report,
    queryFn: financialHealthApi.getReport,
  });
};

export const useFinancialHealthConfig = () => {
  return useQuery({
    queryKey: queryKeys.financialHealth.config,
    queryFn: financialHealthApi.getConfig,
  });
};

export const useRecomputeHealth = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financialHealthApi.recompute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.financialHealth.all });
      toast.success('Financial health score recalculated');
    },
    onError: () => {
      toast.error('Failed to recalculate score');
    },
  });
};

export const useUpdateHealthConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weights: Record<string, { weight: number; enabled: boolean }>) =>
      financialHealthApi.updateConfig(weights),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.financialHealth.all });
      toast.success('Scoring weights updated');
    },
    onError: () => {
      toast.error('Failed to update scoring weights');
    },
  });
};
