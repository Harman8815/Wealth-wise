/**
 * API Services Index
 * Central export for all API services
 */
export {
  authApi,
  type LoginInput,
  type LoginResponse,
  type RefreshResponse,
  type RegisterInput,
} from './auth';
export { systemApi, type DefaultUserResponse, type SeedDataResponse } from './system';
export { userApi, type User, type CreateUserInput, type UpdateUserInput } from './users';
export { accountApi, type Account, type CreateAccountInput, type UpdateAccountInput, type AccountSummary } from './accounts';
export { transactionApi, type Transaction, type CreateTransactionInput, type UpdateTransactionInput, type TransactionSummary, type CategoryBreakdown, type MonthlyStats } from './transactions';
export { budgetCategoryApi, type BudgetCategory, type CreateBudgetCategoryInput, type UpdateBudgetCategoryInput, type BudgetOverview } from './budget-categories';
export { goalApi, type Goal, type CreateGoalInput, type UpdateGoalInput, type GoalProgress } from './goals';
export { alertApi, type Alert, type CreateAlertInput, type UpdateAlertInput, type UnreadCount, type CategoryCount } from './alerts';
export { alertSettingApi, type AlertSetting, type CreateAlertSettingInput, type UpdateAlertSettingInput, type AlertSettingSummary } from './alert-settings';
export { expenseApi, type Expense, type CreateExpenseInput, type UpdateExpenseInput, type ExpenseSummary } from './expenses';
