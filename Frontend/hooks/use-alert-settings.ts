/**
 * Alert Settings Hooks
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alertSettingApi, CreateAlertSettingInput, UpdateAlertSettingInput } from '@/api/services';
import { queryKeys } from '@/api/query-client';

interface AlertSettingFilters {
  category?: string;
  enabled?: boolean;
}

export const useAlertSettings = (filters?: AlertSettingFilters, page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: [...queryKeys.alertSettings.all, filters, page, pageSize],
    queryFn: () => alertSettingApi.getAll({ ...filters, page, pageSize }),
  });
};

export const useAlertSetting = (id: string) => {
  return useQuery({
    queryKey: queryKeys.alertSettings.detail(id),
    queryFn: () => alertSettingApi.getById(id),
    enabled: !!id,
  });
};

export const useAlertSettingsSummary = () => {
  return useQuery({
    queryKey: queryKeys.alertSettings.summary,
    queryFn: alertSettingApi.getSummary,
  });
};

export const useCreateAlertSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: alertSettingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alertSettings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alertSettings.summary });
    },
  });
};

export const useUpdateAlertSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAlertSettingInput }) =>
      alertSettingApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alertSettings.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.alertSettings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alertSettings.summary });
    },
  });
};

export const useDeleteAlertSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: alertSettingApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alertSettings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alertSettings.summary });
    },
  });
};

export const useToggleAlertSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: alertSettingApi.toggle,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alertSettings.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.alertSettings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alertSettings.summary });
    },
  });
};

export const useResetAlertSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: alertSettingApi.resetDefaults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alertSettings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alertSettings.summary });
    },
  });
};
