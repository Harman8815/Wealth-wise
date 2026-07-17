/**
 * Recurring Budgets Hooks
 * React Query hooks for the recurring budget generation platform.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  recurringBudgetApi,
  type CreateRecurringBudgetInput,
  type UpdateRecurringBudgetInput,
  type RecurringBudget,
  type RecurringFrequency,
  type RecurringStatus,
  type BudgetStrategy,
} from '@/api/services';
import { queryKeys } from '@/api/query-client';
import { usePublishNotification } from '@/lib/notifications';

interface RecurringBudgetFilters {
  status?: 'active' | 'paused' | 'completed';
  frequency?: RecurringFrequency;
  strategy?: BudgetStrategy;
  search?: string;
}

export const useRecurringBudgets = (filters?: RecurringBudgetFilters, page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: [...queryKeys.recurringBudgets.all, filters, page, pageSize],
    queryFn: () => recurringBudgetApi.getAll({ ...filters, page, pageSize }),
  });
};

export const useRecurringBudget = (id: string) => {
  return useQuery({
    queryKey: queryKeys.recurringBudgets.detail(id),
    queryFn: () => recurringBudgetApi.getById(id),
    enabled: !!id,
  });
};

export const useRecurringBudgetExecutions = (id: string, page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: [...queryKeys.recurringBudgets.executions(id), page, pageSize],
    queryFn: () => recurringBudgetApi.getExecutions(id, page, pageSize),
    enabled: !!id,
  });
};

export const useRecurringBudgetUpcoming = (id: string, count = 5) => {
  return useQuery({
    queryKey: [...queryKeys.recurringBudgets.upcoming(id), count],
    queryFn: () => recurringBudgetApi.getUpcoming(id, count),
    enabled: !!id,
  });
};

export const useCreateRecurringBudget = () => {
  const queryClient = useQueryClient();
  const publish = usePublishNotification();

  return useMutation({
    mutationFn: (data: CreateRecurringBudgetInput) => recurringBudgetApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringBudgets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.all });
      publish({
        type: 'success',
        title: 'Recurring budget created',
        message: `${data.name} will generate budgets on schedule.`,
        category: 'Budget',
        priority: 'low',
      });
    },
  });
};

export const useUpdateRecurringBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecurringBudgetInput }) =>
      recurringBudgetApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringBudgets.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringBudgets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringBudgets.upcoming(variables.id) });
    },
  });
};

export const useDeleteRecurringBudget = () => {
  const queryClient = useQueryClient();
  const publish = usePublishNotification();

  return useMutation({
    mutationFn: (id: string) => recurringBudgetApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringBudgets.all });
      publish({
        type: 'info',
        title: 'Recurring budget deleted',
        message: 'The rule and its future budgets were removed.',
        category: 'Budget',
        priority: 'low',
      });
    },
  });
};

export const usePauseRecurringBudget = () => {
  const queryClient = useQueryClient();
  const publish = usePublishNotification();

  return useMutation({
    mutationFn: (id: string) => recurringBudgetApi.pause(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringBudgets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringBudgets.detail(data.id) });
      publish({
        type: 'info',
        title: 'Rule paused',
        message: `${data.name} is paused.`,
        category: 'Budget',
        priority: 'low',
      });
    },
  });
};

export const useResumeRecurringBudget = () => {
  const queryClient = useQueryClient();
  const publish = usePublishNotification();

  return useMutation({
    mutationFn: (id: string) => recurringBudgetApi.resume(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringBudgets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringBudgets.detail(data.id) });
      publish({
        type: 'info',
        title: 'Rule resumed',
        message: `${data.name} is active again.`,
        category: 'Budget',
        priority: 'low',
      });
    },
  });
};

export const useGenerateRecurringBudgetNow = () => {
  const queryClient = useQueryClient();
  const publish = usePublishNotification();

  return useMutation({
    mutationFn: (id: string) => recurringBudgetApi.generateNow(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringBudgets.detail(data.rule.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringBudgets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringBudgets.executions(data.rule.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.all });
      publish({
        type: 'success',
        title: 'Budget generated',
        message: `${data.rule.name} was added as a budget.`,
        category: 'Budget',
        priority: 'low',
      });
    },
  });
};

export const useRunDueRecurringBudgets = () => {
  const queryClient = useQueryClient();
  const publish = usePublishNotification();

  return useMutation({
    mutationFn: () => recurringBudgetApi.runDue(),
    onSuccess: (summary) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringBudgets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.all });
      if (summary.generations > 0) {
        publish({
          type: 'success',
          title: 'Budgets generated',
          message: `${summary.generations} scheduled budget(s) created.`,
          category: 'Budget',
          priority: 'low',
        });
      }
    },
  });
};

export type { RecurringBudget, RecurringBudgetFilters };
