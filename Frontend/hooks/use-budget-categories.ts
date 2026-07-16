/**
 * Budget Category Hooks
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetCategoryApi, CreateBudgetCategoryInput, UpdateBudgetCategoryInput } from '@/api/services';
import { queryKeys } from '@/api/query-client';
import { usePublishNotification } from '@/lib/notifications';

export const useBudgetCategories = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: [...queryKeys.budgetCategories.all, page, pageSize],
    queryFn: () => budgetCategoryApi.getAll(page, pageSize),
  });
};

export const useBudgetCategory = (id: string) => {
  return useQuery({
    queryKey: queryKeys.budgetCategories.detail(id),
    queryFn: () => budgetCategoryApi.getById(id),
    enabled: !!id,
  });
};

export const useBudgetOverview = () => {
  return useQuery({
    queryKey: queryKeys.budgetCategories.overview,
    queryFn: budgetCategoryApi.getOverview,
  });
};

export const useCreateBudgetCategory = () => {
  const queryClient = useQueryClient();
  const publish = usePublishNotification();

  return useMutation({
    mutationFn: budgetCategoryApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.overview });
      publish({
        type: 'success',
        title: 'Budget category created',
        message: `"${data.name}" has been added to your budget planner.`,
        category: 'Budget',
        priority: 'medium',
      });
    },
  });
};

export const useUpdateBudgetCategory = () => {
  const queryClient = useQueryClient();
  const publish = usePublishNotification();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBudgetCategoryInput }) =>
      budgetCategoryApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.overview });
      if (data.spent >= data.budgeted && data.budgeted > 0) {
        publish({
          type: 'error',
          title: 'Budget exceeded',
          message: `"${data.name}" has exceeded its budget limit.`,
          category: 'Budget',
          priority: 'high',
        });
      }
    },
  });
};

export const useDeleteBudgetCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: budgetCategoryApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.overview });
    },
  });
};

export const useUpdateBudgetSpent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: budgetCategoryApi.updateSpent,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.all });
    },
  });
};
