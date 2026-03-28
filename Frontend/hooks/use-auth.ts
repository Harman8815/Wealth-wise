/**
 * Authentication Hooks
 * React Query hooks for authentication
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, LoginInput, RegisterInput, userApi } from '@/api/services';
import { queryKeys } from '@/api/query-client';

// Login hook
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await authApi.login(data);
      // Store tokens
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      return response;
    },
    onSuccess: () => {
      // Invalidate user queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
  });
};

// Register hook
export const useRegister = () => {
  return useMutation({
    mutationFn: authApi.register,
  });
};

// Logout hook
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      authApi.logout();
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
    },
  });
};

// Get current user hook
export const useMe = () => {
  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: userApi.getMe,
    retry: false,
  });
};

// Check if user is authenticated
export const useIsAuthenticated = () => {
  const { data: user, isLoading } = useMe();
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
};
