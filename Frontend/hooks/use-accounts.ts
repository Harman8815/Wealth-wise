/**
 * Account Hooks
 * React Query hooks for account management
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountApi, CreateAccountInput, UpdateAccountInput } from '@/api/services';
import { queryKeys } from '@/api/query-client';

// Get all accounts
export const useAccounts = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: [...queryKeys.accounts.all, page, pageSize],
    queryFn: () => accountApi.getAll(page, pageSize),
  });
};

// Get account by ID
export const useAccount = (id: string) => {
  return useQuery({
    queryKey: queryKeys.accounts.detail(id),
    queryFn: () => accountApi.getById(id),
    enabled: !!id,
  });
};

// Get account summary
export const useAccountSummary = () => {
  return useQuery({
    queryKey: queryKeys.accounts.summary,
    queryFn: accountApi.getSummary,
  });
};

// Create account
export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.summary });
    },
  });
};

// Update account
export const useUpdateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountInput }) =>
      accountApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.summary });
    },
  });
};

// Delete account
export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.summary });
    },
  });
};

// Toggle account active status
export const useToggleAccountActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountApi.toggleActive,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
};
