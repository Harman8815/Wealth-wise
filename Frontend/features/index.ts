/**
 * Features Index
 * Feature-based module exports
 * 
 * Note: For backward compatibility, these re-export from existing locations.
 * Future development should move new code into feature folders.
 */

// Re-export from existing API services (backward compatible)
export {
  authApi,
  type LoginInput,
  type LoginResponse,
  type RefreshResponse,
  type RegisterInput,
} from '@/api/services/auth';
export { userApi, type User, type CreateUserInput, type UpdateUserInput } from '@/api/services/users';
export { accountApi, type Account, type CreateAccountInput, type UpdateAccountInput, type AccountSummary } from '@/api/services/accounts';
export { transactionApi, type Transaction, type CreateTransactionInput, type UpdateTransactionInput, type TransactionSummary, type CategoryBreakdown, type MonthlyStats } from '@/api/services/transactions';
export { budgetCategoryApi, type BudgetCategory, type CreateBudgetCategoryInput, type UpdateBudgetCategoryInput, type BudgetOverview } from '@/api/services/budget-categories';
export { goalApi, type Goal, type CreateGoalInput, type UpdateGoalInput, type GoalProgress } from '@/api/services/goals';
export { alertApi, type Alert, type CreateAlertInput, type UpdateAlertInput, type UnreadCount, type CategoryCount } from '@/api/services/alerts';
export { alertSettingApi, type AlertSetting, type CreateAlertSettingInput, type UpdateAlertSettingInput, type AlertSettingSummary } from '@/api/services/alert-settings';
export { expenseApi, type Expense, type CreateExpenseInput, type UpdateExpenseInput, type ExpenseSummary } from '@/api/services/expenses';

// Re-export hooks (backward compatible)
export {
  useLogin,
  useRegister,
  useLogout,
  useMe,
  useIsAuthenticated,
} from '@/hooks/use-auth';
export {
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/hooks/use-users';
export {
  useAccounts,
  useAccount,
  useAccountSummary,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useToggleAccountActive,
} from '@/hooks/use-accounts';
export {
  useTransactions,
  useTransaction,
  useTransactionSummary,
  useTransactionsByCategory,
  useMonthlyStats,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/hooks/use-transactions';
export {
  useBudgetCategories,
  useBudgetCategory,
  useBudgetOverview,
  useCreateBudgetCategory,
  useUpdateBudgetCategory,
  useDeleteBudgetCategory,
  useUpdateBudgetSpent,
} from '@/hooks/use-budget-categories';
export {
  useGoals,
  useGoal,
  useGoalProgress,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useContributeToGoal,
  useToggleGoalStatus,
} from '@/hooks/use-goals';
export {
  useAlerts,
  useAlert,
  useUnreadCount,
  useAlertsByCategory,
  useCreateAlert,
  useUpdateAlert,
  useDeleteAlert,
  useMarkAlertRead,
  useMarkAlertUnread,
  useMarkAllAlertsRead,
} from '@/hooks/use-alerts';
export {
  useAlertSettings,
  useAlertSetting,
  useAlertSettingsSummary,
  useCreateAlertSetting,
  useUpdateAlertSetting,
  useDeleteAlertSetting,
  useToggleAlertSetting,
  useResetAlertSettings,
} from '@/hooks/use-alert-settings';
export {
  useExpenses,
  useExpense,
  useExpenseSummary,
  useRecentExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/hooks/use-expenses';
