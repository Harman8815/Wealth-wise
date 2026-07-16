/**
 * Goal Hooks
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { goalApi, CreateGoalInput, UpdateGoalInput } from '@/api/services';
import { queryKeys } from '@/api/query-client';
import { usePublishNotification } from '@/lib/notifications';

interface GoalFilters {
  category?: string;
  priority?: string;
  status?: string;
}

export const useGoals = (filters?: GoalFilters, page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: [...queryKeys.goals.all, filters, page, pageSize],
    queryFn: () => goalApi.getAll({ ...filters, page, pageSize }),
  });
};

export const useGoal = (id: string) => {
  return useQuery({
    queryKey: queryKeys.goals.detail(id),
    queryFn: () => goalApi.getById(id),
    enabled: !!id,
  });
};

export const useGoalProgress = () => {
  return useQuery({
    queryKey: queryKeys.goals.progress,
    queryFn: goalApi.getProgress,
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  const publish = usePublishNotification();

  return useMutation({
    mutationFn: goalApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.progress });
      publish({
        type: 'success',
        title: 'Goal created',
        message: `"${data.title}" has been added to your goals.`,
        category: 'Goals',
        priority: 'medium',
      });
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalInput }) =>
      goalApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.progress });
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: goalApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.progress });
    },
  });
};

export const useContributeToGoal = () => {
  const queryClient = useQueryClient();
  const publish = usePublishNotification();

  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      goalApi.contribute(id, amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.progress });
      if (data.percentage_complete >= 100) {
        publish({
          type: 'success',
          title: 'Goal completed!',
          message: `"${data.title}" has reached its target.`,
          category: 'Goals',
          priority: 'high',
        });
      }
    },
  });
};

export const useToggleGoalStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: goalApi.toggleStatus,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });
};
