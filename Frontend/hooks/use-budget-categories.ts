/**
 * Budget Category Hooks
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetCategoryApi, CreateBudgetCategoryInput, UpdateBudgetCategoryInput } from '@/api/services';
import { queryKeys } from '@/api/query-client';

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

  return useMutation({
    mutationFn: budgetCategoryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.overview });
    },
  });
};

export const useUpdateBudgetCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBudgetCategoryInput }) =>
      budgetCategoryApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.overview });
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
