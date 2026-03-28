/**
 * Transaction Hooks
 * React Query hooks for transaction management
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionApi, CreateTransactionInput, UpdateTransactionInput } from '@/api/services';
import { queryKeys } from '@/api/query-client';

interface TransactionFilters {
  category?: string;
  type?: 'income' | 'expense';
  status?: 'completed' | 'pending';
  date?: string;
}

// Get all transactions with filters
export const useTransactions = (filters?: TransactionFilters, page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: [...queryKeys.transactions.all, filters, page, pageSize],
    queryFn: () => transactionApi.getAll({ ...filters, page, pageSize }),
  });
};

// Get transaction by ID
export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => transactionApi.getById(id),
    enabled: !!id,
  });
};

// Get transaction summary
export const useTransactionSummary = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: [...queryKeys.transactions.summary, startDate, endDate],
    queryFn: () => transactionApi.getSummary(startDate, endDate),
  });
};

// Get transactions by category
export const useTransactionsByCategory = () => {
  return useQuery({
    queryKey: queryKeys.transactions.byCategory,
    queryFn: transactionApi.getByCategory,
  });
};

// Get monthly stats
export const useMonthlyStats = (months = 12) => {
  return useQuery({
    queryKey: [...queryKeys.transactions.monthlyStats, months],
    queryFn: () => transactionApi.getMonthlyStats(months),
  });
};

// Create transaction
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.summary });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.byCategory });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.monthlyStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.all });
    },
  });
};

// Update transaction
export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionInput }) =>
      transactionApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.summary });
    },
  });
};

// Delete transaction
export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.summary });
    },
  });
};
