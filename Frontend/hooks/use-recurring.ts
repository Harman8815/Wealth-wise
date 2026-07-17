/**
 * Recurring Transactions Hooks
 * React Query hooks for the recurring scheduling platform.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recurringApi, type CreateRecurringInput, type UpdateRecurringInput, type RecurringFrequency, type RecurringType } from '@/api/services';
import { queryKeys } from '@/api/query-client';
import { usePublishNotification } from '@/lib/notifications';

interface RecurringFilters {
  type?: 'income' | 'expense';
  status?: 'active' | 'paused' | 'completed';
  frequency?: RecurringFrequency;
  search?: string;
}

export const useRecurringRules = (filters?: RecurringFilters, page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: [...queryKeys.recurring.all, filters, page, pageSize],
    queryFn: () => recurringApi.getAll({ ...filters, page, pageSize }),
  });
};

export const useRecurringRule = (id: string) => {
  return useQuery({
    queryKey: queryKeys.recurring.detail(id),
    queryFn: () => recurringApi.getById(id),
    enabled: !!id,
  });
};

export const useRecurringExecutions = (id: string, page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: [...queryKeys.recurring.executions(id), page, pageSize],
    queryFn: () => recurringApi.getExecutions(id, page, pageSize),
    enabled: !!id,
  });
};

export const useRecurringUpcoming = (id: string, count = 5) => {
  return useQuery({
    queryKey: [...queryKeys.recurring.upcoming(id), count],
    queryFn: () => recurringApi.getUpcoming(id, count),
    enabled: !!id,
  });
};

export const useCreateRecurring = () => {
  const queryClient = useQueryClient();
  const publish = usePublishNotification();

  return useMutation({
    mutationFn: (data: CreateRecurringInput) => recurringApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      publish({
        type: 'success',
        title: 'Recurring rule created',
        message: `${data.name} will run on schedule.`,
        category: 'Bills',
        priority: 'low',
      });
    },
  });
};

export const useUpdateRecurring = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecurringInput }) =>
      recurringApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.upcoming(variables.id) });
    },
  });
};

export const useDeleteRecurring = () => {
  const queryClient = useQueryClient();
  const publish = usePublishNotification();

  return useMutation({
    mutationFn: (id: string) => recurringApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      publish({
        type: 'info',
        title: 'Recurring rule deleted',
        message: 'The schedule and its future executions were removed.',
        category: 'Bills',
        priority: 'low',
      });
    },
  });
};

export const usePauseRecurring = () => {
  const queryClient = useQueryClient();
  const publish = usePublishNotification();

  return useMutation({
    mutationFn: (id: string) => recurringApi.pause(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.detail(data.id) });
      publish({
        type: 'info',
        title: 'Rule paused',
        message: `${data.name} is paused.`,
        category: 'Bills',
        priority: 'low',
      });
    },
  });
};

export const useResumeRecurring = () => {
  const queryClient = useQueryClient();
  const publish = usePublishNotification();

  return useMutation({
    mutationFn: (id: string) => recurringApi.resume(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.detail(data.id) });
      publish({
        type: 'info',
        title: 'Rule resumed',
        message: `${data.name} is active again.`,
        category: 'Bills',
        priority: 'low',
      });
    },
  });
};

export const useGenerateRecurringNow = () => {
  const queryClient = useQueryClient();
  const publish = usePublishNotification();

  return useMutation({
    mutationFn: (id: string) => recurringApi.generateNow(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.detail(data.rule.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.executions(data.rule.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      publish({
        type: 'success',
        title: 'Transaction generated',
        message: `${data.rule.name} was added as a transaction.`,
        category: 'Bills',
        priority: 'low',
      });
    },
  });
};

export const useRunDueRecurring = () => {
  const queryClient = useQueryClient();
  const publish = usePublishNotification();

  return useMutation({
    mutationFn: () => recurringApi.runDue(),
    onSuccess: (summary) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      if (summary.executions > 0) {
        publish({
          type: 'success',
          title: 'Recurring processed',
          message: `${summary.executions} scheduled transaction(s) created.`,
          category: 'Bills',
          priority: 'low',
        });
      }
    },
  });
};
