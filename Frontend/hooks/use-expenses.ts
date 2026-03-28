/**
 * Expense Hooks
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expenseApi, CreateExpenseInput, UpdateExpenseInput } from '@/api/services';
import { queryKeys } from '@/api/query-client';

interface ExpenseFilters {
  category?: string;
  date?: string;
}

export const useExpenses = (filters?: ExpenseFilters, page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: [...queryKeys.expenses.all, filters, page, pageSize],
    queryFn: () => expenseApi.getAll({ ...filters, page, pageSize }),
  });
};

export const useExpense = (id: string) => {
  return useQuery({
    queryKey: queryKeys.expenses.detail(id),
    queryFn: () => expenseApi.getById(id),
    enabled: !!id,
  });
};

export const useExpenseSummary = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: [...queryKeys.expenses.summary, startDate, endDate],
    queryFn: () => expenseApi.getSummary(startDate, endDate),
  });
};

export const useRecentExpenses = (days = 30, limit = 10) => {
  return useQuery({
    queryKey: [...queryKeys.expenses.recent, days, limit],
    queryFn: () => expenseApi.getRecent(days, limit),
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expenseApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.summary });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.recent });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseInput }) =>
      expenseApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.summary });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expenseApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.summary });
    },
  });
};
