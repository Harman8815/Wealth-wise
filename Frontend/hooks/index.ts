/**
 * Hooks Index
 * Central export for all custom hooks
 */
export {
  useLogin,
  useRegister,
  useLogout,
  useMe,
  useIsAuthenticated,
  useEnsureDefaultUser,
  useSeedHistoricalData,
} from './use-auth';

export {
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from './use-users';

export {
  useAccounts,
  useAccount,
  useAccountSummary,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useToggleAccountActive,
} from './use-accounts';

export {
  useTransactions,
  useTransaction,
  useTransactionSummary,
  useTransactionsByCategory,
  useMonthlyStats,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useTransactionHistory,
} from './use-transactions';

export {
  useCategories,
  useCategory,
  useSearchCategories,
  useDefaultCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from './use-categories';

export {
  useBudgetCategories,
  useBudgetCategory,
  useBudgetOverview,
  useCreateBudgetCategory,
  useUpdateBudgetCategory,
  useDeleteBudgetCategory,
  useUpdateBudgetSpent,
} from './use-budget-categories';

export {
  useGoals,
  useGoal,
  useGoalProgress,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useContributeToGoal,
  useToggleGoalStatus,
} from './use-goals';

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
  useDismissAlert,
  useMarkAllAlertsRead,
  useDismissAllAlerts,
  useGenerateAlerts,
} from './use-alerts';

export {
  useAlertSettings,
  useAlertSetting,
  useAlertSettingsSummary,
  useCreateAlertSetting,
  useUpdateAlertSetting,
  useDeleteAlertSetting,
  useToggleAlertSetting,
  useResetAlertSettings,
} from './use-alert-settings';

export {
  useImportHistory,
  useExportHistory,
  useMappingTemplates,
  useUploadImport,
  useCommitImport,
  useExportData,
  useSaveMappingTemplate,
} from './use-io';
