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
  QUICK_LOGIN_USERS,
} from './auth';
export { systemApi, type DefaultUserResponse, type SeedDataResponse } from './system';
export { userApi, type User, type CreateUserInput, type UpdateUserInput } from './users';
export { accountApi, type Account, type CreateAccountInput, type UpdateAccountInput, type AccountSummary } from './accounts';
export {
  transactionApi,
  type Transaction,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type TransactionSummary,
  type CategoryBreakdown,
  type MonthlyStats,
} from './transactions';
export { budgetCategoryApi, type BudgetCategory, type CreateBudgetCategoryInput, type UpdateBudgetCategoryInput, type BudgetOverview } from './budget-categories';
export { categoryApi, type Category, type CreateCategoryInput, type UpdateCategoryInput } from './categories';
export { goalApi, type Goal, type CreateGoalInput, type UpdateGoalInput, type GoalProgress } from './goals';
export { alertApi, type Alert, type AlertPriority, type AlertCategory, type AlertType, type CreateAlertInput, type UpdateAlertInput, type UnreadCount, type CategoryCount } from './alerts';
export { alertSettingApi, type AlertSetting, type CreateAlertSettingInput, type UpdateAlertSettingInput, type AlertSettingSummary } from './alert-settings';
export { expenseApi, type Expense, type CreateExpenseInput, type UpdateExpenseInput, type ExpenseSummary } from './expenses';
export {
  recurringApi,
  type RecurringRule,
  type RecurringExecution,
  type CreateRecurringInput,
  type UpdateRecurringInput,
  type RecurringFrequency,
  type RecurringStatus,
  type RecurringType,
  type RunDueSummary,
} from './recurring';
export {
  recurringBudgetApi,
  type RecurringBudget,
  type RecurringBudgetExecution,
  type CreateRecurringBudgetInput,
  type UpdateRecurringBudgetInput,
  type BudgetAllocation,
  type BudgetStrategy,
  type RunDueBudgetSummary,
} from './recurring-budgets';
export {
  projectApi,
  type Project,
  type ProjectRole,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ProjectMember,
  type ProjectInvitation,
  type ProjectContext,
  type AddMemberInput,
} from './projects';
export {
  reportsApi,
  type ScheduledReport,
  type CreateScheduledReportInput,
  type FilterReportsInput,
  type FilterReportsResponse,
  type ReportType,
  type ReportFrequency,
} from './reports';
export {
  generateMLReport,
  getMLReportSummary,
  explainChartOrAlert,
} from './ml-reports';
export {
  ioApi,
  type UploadResponse,
  type CommitResponse,
} from './io';
export {
  financialHealthApi,
  type FinancialHealthSnapshot,
  type HealthDimension,
  type HealthRecommendation,
  type HealthReport,
  type HealthConfig,
  type DimensionConfig,
} from './financial-health';
export {
  insightsApi,
  type AIInsight,
  type InsightsListResponse,
} from './insights';
export {
  sendChatMessage,
  sendChatMessageStream,
  type ChatMessage,
  type ChatRequest,
  type ChatResponse,
} from './chat';
export {
  listConversations,
  getConversation,
  deleteConversation,
  renameConversation,
  createConversation,
  type Conversation,
  type ConversationListResponse,
} from './conversations';
export {
  mlApi,
  type Anomaly,
  type AnomaliesResponse,
  type ForecastResponse,
  type ClustersResponse,
  type BudgetForecastResponse,
} from './ml';
