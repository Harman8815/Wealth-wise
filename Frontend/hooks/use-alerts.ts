/**
 * Alert Hooks
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alertApi, CreateAlertInput, UpdateAlertInput } from '@/api/services';
import { queryKeys } from '@/api/query-client';

interface AlertFilters {
  type?: string;
  category?: string;
  read?: boolean;
}

export const useAlerts = (filters?: AlertFilters, page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: [...queryKeys.alerts.all, filters, page, pageSize],
    queryFn: () => alertApi.getAll({ ...filters, page, pageSize }),
  });
};

export const useAlert = (id: string) => {
  return useQuery({
    queryKey: queryKeys.alerts.detail(id),
    queryFn: () => alertApi.getById(id),
    enabled: !!id,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: queryKeys.alerts.unreadCount,
    queryFn: alertApi.getUnreadCount,
  });
};

export const useAlertsByCategory = () => {
  return useQuery({
    queryKey: queryKeys.alerts.byCategory,
    queryFn: alertApi.getByCategory,
  });
};

export const useCreateAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: alertApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.unreadCount });
    },
  });
};

export const useUpdateAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAlertInput }) =>
      alertApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
  });
};

export const useDeleteAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: alertApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.unreadCount });
    },
  });
};

export const useMarkAlertRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: alertApi.markRead,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.unreadCount });
    },
  });
};

export const useMarkAlertUnread = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: alertApi.markUnread,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.unreadCount });
    },
  });
};

export const useMarkAllAlertsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: alertApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.unreadCount });
    },
  });
};
