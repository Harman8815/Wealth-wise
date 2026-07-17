/**
 * Query Client Configuration
 * React Query setup with default options
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query keys factory for type-safe caching
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
    login: ['auth', 'login'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
    me: ['users', 'me'] as const,
  },
  accounts: {
    all: ['accounts'] as const,
    detail: (id: string) => ['accounts', id] as const,
    summary: ['accounts', 'summary'] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    detail: (id: string) => ['transactions', id] as const,
    summary: ['transactions', 'summary'] as const,
    byCategory: ['transactions', 'by-category'] as const,
    monthlyStats: ['transactions', 'monthly-stats'] as const,
    history: (id: string) => ['transactions', id, 'history'] as const,
  },
  budgetCategories: {
    all: ['budget-categories'] as const,
    detail: (id: string) => ['budget-categories', id] as const,
    overview: ['budget-categories', 'overview'] as const,
  },
  categories: {
    all: ['categories'] as const,
    detail: (id: string) => ['categories', id] as const,
    search: (query: string, type?: string) => ['categories', 'search', query, type] as const,
    defaults: ['categories', 'defaults'] as const,
  },
  goals: {
    all: ['goals'] as const,
    detail: (id: string) => ['goals', id] as const,
    progress: ['goals', 'progress'] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    detail: (id: string) => ['alerts', id] as const,
    unreadCount: ['alerts', 'unread-count'] as const,
    byCategory: ['alerts', 'by-category'] as const,
  },
  alertSettings: {
    all: ['alert-settings'] as const,
    detail: (id: string) => ['alert-settings', id] as const,
    summary: ['alert-settings', 'summary'] as const,
  },
  expenses: {
    all: ['expenses'] as const,
    detail: (id: string) => ['expenses', id] as const,
    summary: ['expenses', 'summary'] as const,
    recent: ['expenses', 'recent'] as const,
  },
  projects: {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
    context: ['projects', 'context'] as const,
    members: (id: string) => ['projects', id, 'members'] as const,
    invitations: (id: string) => ['projects', id, 'invitations'] as const,
  },
  io: {
    imports: ['io', 'imports'] as const,
    exports: ['io', 'exports'] as const,
    templates: ['io', 'templates'] as const,
  },
} as const;
