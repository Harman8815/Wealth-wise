/**
 * Category Hooks
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '@/api/services';
import { queryKeys } from '@/api/query-client';

interface CategoryFilters {
  type?: string;
}

export const useCategories = (filters?: CategoryFilters, page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: [...queryKeys.categories.all, filters, page, pageSize],
    queryFn: () => categoryApi.getAll(page, pageSize, filters?.type),
  });
};

export const useCategory = (id: string) => {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => categoryApi.getById(id),
    enabled: !!id,
  });
};

export const useSearchCategories = (query: string, type?: string) => {
  return useQuery({
    queryKey: queryKeys.categories.search(query, type),
    queryFn: () => categoryApi.search(query, type),
    enabled: query.length > 0,
  });
};

export const useDefaultCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories.defaults,
    queryFn: categoryApi.getDefaults,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; color?: string; text_color?: string; icon?: string; symbol?: string } }) =>
      categoryApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoryApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
};
