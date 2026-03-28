/**
 * User Hooks
 * React Query hooks for user management
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi, CreateUserInput, UpdateUserInput } from '@/api/services';
import { queryKeys } from '@/api/query-client';

// Get all users
export const useUsers = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: [...queryKeys.users.all, page, pageSize],
    queryFn: () => userApi.getAll(page, pageSize),
  });
};

// Get user by ID
export const useUser = (id: string) => {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => userApi.getById(id),
    enabled: !!id,
  });
};

// Create user
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

// Update user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      userApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
  });
};

// Delete user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};
