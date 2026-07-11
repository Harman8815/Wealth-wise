# WealthWise Dashboard - Detailed Documentation

> **Recent Feature Additions**
> - Circular Budget Gauge (SVG, color-coded status: On Track / Near Budget Limit / Budget Exceeded)
> - Backend alert engine + Generate button on Alerts page (`POST /api/alerts/generate/`)
> - Dashboard load-time notification toasts (`sonner`, deduplicated per session via `sessionStorage`)
> - Dedicated Notification Settings page (`/dashboard/notifications`)
> - Scheduled Reports page (`/dashboard/reports/scheduled`) with PDF generation
> - Report Export presets with PDF / CSV / Excel (Excel generated client-side as HTML-table `.xls` blob)

## Table of Contents

1. [Dashboard Overview](#dashboard-overview)
2. [Dashboard Home (`/dashboard`)](#dashboard-home-dashboard)
3. [Transactions (`/dashboard/transactions`)](#transactions-dashboardtransactions)
4. [Reports & Insights (`/dashboard/reports`)](#reports--insights-dashboardreports)
5. [Financial Goals (`/dashboard/goals`)](#financial-goals-dashboardgoals)
6. [Budget Planner (`/dashboard/budget`)](#budget-planner-dashboardbudget)
7. [Alerts & Notifications (`/dashboard/alerts`)](#alerts--notifications-dashboardalerts)
8. [Notification Settings (`/dashboard/notifications`)](#notification-settings-dashboardnotifications)
9. [Settings Dialog](#settings-dialog)
10. [Currency, Icons, and Formatting](#currency-icons-and-formatting)
11. [Backend Endpoints](#backend-endpoints)

---

## Dashboard Overview

### Layout Structure
- **Sidebar Navigation**: Contains links to all dashboard sections with icons (Dashboard, Budget Planner, Transactions, Reports & Insights, Goals, Alerts & Notifications)
- **Header**: Sticky, glass-morphism header with title, description, and action buttons
- **Main Content**: Dynamic content area that changes based on active section
- **Responsive Design**: Mobile-first with collapsible sidebar (`lg:hidden` hamburger menu, Sheet on mobile)

### Color Scheme
- **Primary Green**: `#10b981` (Income, Positive values)
- **Primary Red**: `#ef4444` (Expenses, Negative values)
- **Primary Blue**: `#3b82f6` (Active Goals, Navigation)
- **Primary Purple**: `#8b5cf6` (Targets, Analytics)
- **Chart Colors**: `#ef4444`, `#3b82f6`, `#10b981`, `#8b5cf6`, `#f59e0b`, `#ec4899`

### Background
- Gradient: `from-background via-background to-muted/20`

---

## Dashboard Home (`/dashboard`)

### File Location
- `components/dashboard/main-content.tsx`
- `app/dashboard/page.tsx`

### Notification Toasts
- **Component**: `components/dashboard/notification-toasts.tsx`
- Fetches unread alerts via `useAlerts({ read: false }, 1, 5)` and renders each as a `sonner` toast on load
- Deduplicated per session via `sessionStorage` key `wealthwise_shown_alerts` — viewing a toast does NOT mark the alert as read
- Returns `null` (no DOM element); toasts are rendered by `sonner` provider

### Overview Cards (4 Cards via `OverviewCards` component)
- **Total Balance** — Wallet icon, sum of all account balances
- **Monthly Income** — TrendingUp icon (green), `₹{value.toLocaleString()}`, subtitle "This month's earnings"
- **Monthly Expenses** — TrendingDown icon (red), `₹{value.toLocaleString()}`, subtitle "Total spending"
- **Net Savings** — PieChart/Wallet icon, `₹{netFlow.toLocaleString()}`, conditional coloring (green if positive, red if negative), subtitle "Net savings this month"

### Cash Flow Chart (Full Width)
- **Type**: Bar Chart (Recharts `MonthlyChart` component)
- **Data**: Last 6 months of income vs expenses
- **Colors**: Green `#10b981` for Income, Red `#ef4444` for Expenses
- **Features**: CartesianGrid, formatted currency tooltip, responsive container

### AI Insights Card
- **Component**: `AIInsightsCard` from `@/shared/components`
- **Data**: Static `sampleInsights` array in `main-content.tsx` (3 items: Spending Alert, Savings Opportunity, Investment Tip)
- Each insight has: `id`, `type`, `title`, `description`, `impact`, `metadata`, `action`

### Recent Transactions
- **Component**: `RecentTransactions` from `./recent-transactions`
- Displays latest transactions with icon, date, description, category badge, account, status badge, amount

### Quick Stats Row (3 Cards)
1. **Upcoming Bills** — Calendar icon (blue), "3 due this week"
2. **AI Recommendations** — Sparkles icon (emerald), "5 new insights"
3. **Next Payday** — Calendar icon (purple), "In 5 days"

### Header Actions
- **Seed Demo Data** button (calls `useSeedHistoricalData` mutation, shows `sonner` toast on success/failure)
- **Add Transaction** button (opens `AddTransactionDialog`)
- **This Month** button (display only)

---

## Transactions (`/dashboard/transactions`)

### File Location
- `components/dashboard/pages/transactions.tsx`
- Route: `/dashboard/transactions`

### Summary Cards (3 Cards)
- **Total Income** — `₹{totalIncome.toLocaleString()}`, green text, subtitle "This month"
- **Total Expenses** — `₹{totalExpenses.toLocaleString()}`, red text, subtitle "This month"
- **Net Flow** — `₹{Math.abs(netFlow).toLocaleString()}`, conditional green/red, subtitle "This month"
- Data source: `useTransactionSummary()` hook (`summary?.income`, `summary?.expense`, `summary?.net`)

### Filter Card
- **Search Input** — Placeholder "Search transactions...", filters by description and category, Search icon
- **Category Select** — Options: All Categories, Food & Dining, Transportation, Entertainment, Shopping, Bills & Utilities, Healthcare, Income
- **Type Select** — Options: All Types, Income, Expense
- **Sort By Select** — Options: Date, Amount (clickable column headers in table also toggle sort)
- **Clear All Filters** button (ghost, appears when filters active)

### Transaction Table
- **Columns**: Icon, Date, Description, Category, Account, Status, Amount, Actions
- **Icon**: Category symbol rendered in a colored circle (`ICON_MAP` + `getCategoryIcon`)
- **Date**: `new Date(transaction.date).toLocaleDateString()`
- **Description**: Plain text with type-colored amount
- **Category**: `Badge variant="outline"` with `transaction.category?.name`
- **Account**: `transaction.account_name` or "-"
- **Status**: `Badge variant="default"` (completed) or `"secondary"` (pending)
- **Amount**: `+₹{value.toLocaleString()}` for income, `-₹{value.toLocaleString()}` for expense, green/red text
- **Actions**: Eye icon button to open detail dialog

### Transaction Detail Dialog
- Opens when clicking the View (Eye) action on a row
- Displays: Date, Status, Description, Category, Type, Amount, Account
- **Edit History** section — fetched via `useTransactionHistory(transactionId)`, shows `field_name`, `old_value → new_value`, `changed_at` timestamp
- **Edit** button opens `EditTransactionDialog` (date, description, category via `SearchableCategoryInput`, amount, type)
- **Delete** button with confirmation (`confirm()`), calls `useDeleteTransaction`

### Pagination
- `PAGE_SIZE = 10` items per page
- Controls: First, Previous, numbered page buttons (up to 5 visible), Next, Last (SkipForward icon)
- Shows "Page X of Y · Z total transactions"
- Data source: `useTransactions(filters, page, PAGE_SIZE)` — uses Django-style pagination (`next`/`previous`)

---

## Reports & Insights (`/dashboard/reports`)

### File Location
- `components/dashboard/pages/reports.tsx`
- Route: `/dashboard/reports`

### Metric Cards (4 Cards)
- **Avg Income** — DollarSign icon (emerald), `₹{Math.round(avgIncome).toLocaleString()}`, subtitle "Average monthly"
- **Avg Expenses** — TrendingDown icon (red), `₹{Math.round(avgExpense).toLocaleString()}`, subtitle "Average monthly"
- **Net Savings** — TrendingUp icon (green), `₹{Math.round(avgIncome - avgExpense).toLocaleString()}`, subtitle "Per month"
- **Savings Rate** — PieChart icon (purple), `{percentage}%`, subtitle "Excellent" or "Keep improving"
- Data source: `useMonthlyStats(24)` — computed as averages across 24 months

### Income & Expense Trend Chart
- **Type**: Toggleable Bar / Line chart (Recharts)
- **Time View Tabs**: Daily, Monthly, Yearly — switches data and X-axis key
- **Category Filter**: Checkbox dialog (`Filters` button → `Trend Options` dialog) to filter by category
- **Compare with previous period** toggle
- **Show grid lines** toggle
- Bar colors: Income `#10b981`, Expenses `#ef4444`
- Tooltip: Custom `CustomTooltip` with `₹{value.toLocaleString()}` formatting

### Expense Breakdown
- **Type**: Donut Pie Chart (Recharts) + horizontal category list
- **Data**: `useTransactionsByCategory()` — mapped to `{name, value, color}` with `DEFAULT_CATEGORIES` color rotation
- **Manage Categories** dialog — add/remove categories from the chart display
- Category list shows: color dot, name, `₹{value.toLocaleString()}`, percentage, mini progress bar

### Budget Distribution Radar
- **Type**: Radar Chart (Recharts)
- **View Toggle**: Monthly / Yearly
- Two Radar series: Budgeted (`#3b82f6`) vs Spent (`#ef4444`)
- Data derived from `categoryData` — monthly view uses `budget: total*1.5, spent: total`; yearly view uses `budget: total*12, spent: total*12`

### Financial Health Score
- Large centered score display: `8.5` with "Excellent" label
- Sub-metrics:
  | Metric | Score |
  |--------|-------|
  | Savings Rate | 9/10 |
  | Budget Adherence | 8/10 |
  | Expense Control | 7/10 |
  | Goal Progress | 9/10 |

### Key Insights
- 3 color-coded insight cards (green, blue, purple) with static messages about savings rate, spending patterns, and recommendations

### Export Menu
- **Dropdown** triggered by Export button (disabled while exporting)
- **Export as PDF** submenu: Complete Financial Report, Budget Summary, Monthly Report, Category Analysis, Spending Trends — calls `GET /reports/generate_pdf/`
- **Export as CSV** submenu: same presets — calls `GET /transactions/export_csv/`
- **Export as Excel** submenu: same presets — client-side HTML-table `.xls` blob (no new dependency)
- **Scheduled Reports** link → `/dashboard/reports/scheduled`

---

## Financial Goals (`/dashboard/goals`)

### File Location
- `components/dashboard/pages/goals.tsx`
- Route: `/dashboard/goals`

### Add Goal Dialog
- **Trigger**: "Add Goal" button in header
- **Fields**:
  | Field | Type |
  |-------|------|
  | Goal Title | Text input, placeholder "e.g., Emergency Fund" |
  | Description | Text input, placeholder "Brief description of your goal" |
  | Target Amount (₹) | Number input, placeholder "100000" |
  | Target Date | Date input |
  | Category | Select: Emergency, Travel, Technology, Transportation, Education, Investment, Other |
  | Priority | Select: High, Medium, Low |

### Overview Cards (4 Cards)
- **Active Goals** — Count of `status === "active"`, blue text, subtitle "In progress"
- **Completed Goals** — Count of `status === "completed"`, green text, subtitle "Achieved"
- **Total Target** — `₹{totalTargetAmount.toLocaleString()}`, purple text, subtitle "All active goals"
- **Total Saved** — `₹{totalCurrentAmount.toLocaleString()}`, green text, subtitle "{percentage}% of target"
- Data source: `useGoalProgress()` (`total_target`, `total_saved`)

### Active Goals List
- Each goal card displays:
  - Title, Priority badge (color-coded: high=red, medium=yellow, low=green), Category badge (outline)
  - Description
  - Target amount with Target icon, Time remaining with Calendar icon
  - Progress bar (`Progress` component, h-3): `₹{current} / ₹{target}`, `{pct.toFixed(1)}%`
  - Remaining amount, Target date
- `getTimeRemaining()`: Overdue, Due today, X days left, X months left, X years left

### Completed Goals Section
- Conditionally rendered when `completedGoals.length > 0`
- Green-themed card (`bg-green-50 dark:bg-green-950` border)
- Each goal: Title, Description, Target amount, "Completed" badge

### Goal Tips
- 4 tip cards in a 2-column grid (SMART Goals, Automate Savings, Track Progress, Celebrate Milestones)

---

## Budget Planner (`/dashboard/budget`)

### File Location
- `components/dashboard/pages/budget-planner.tsx`
- Route: `/dashboard/budget`

### Budget Gauge (Primary Focal Element)
- **Component**: `components/dashboard/budget-gauge.tsx`
- **Type**: SVG circular gauge with animated needle
- **Props**: `totalBudget`, `spent`, `remaining`, `percentage`, `size` (default 300px)
- **Status Logic** (`getStatus`):
  - `percentage > 100` → "Budget Exceeded" (red `#ef4444`)
  - `percentage >= 80` → "Near Budget Limit" (amber `#f59e0b`)
  - `< 80` → "On Track" (green `#10b981`)
- **Center Stats Row**: Total Budget (`₹{value.toLocaleString()}`), Spent (red), Remaining (conditional green/red)

### Stat Cards (3 Cards, below gauge)
- **Total Budget** — Blue text, `₹{totalBudgeted.toLocaleString()}`, subtitle "Monthly allocation"
- **Total Spent** — Red text, `₹{totalSpent.toLocaleString()}`, subtitle "{pct}% of budget"
- **Remaining** — Conditional green/red, `₹{remainingBudget.toLocaleString()}`, subtitle "Under budget" / "Over budget"

### Category Budgets List
- Sorted by highest consumption ratio (`spent/budgeted`)
- Each category row:
  - Colored icon circle + category name + "Over Budget" (destructive badge) or "Near Limit" (orange badge) when applicable
  - Right side: `₹{spent} / ₹{budgeted}`, `{pct.toFixed(1)}% used`, View (Eye) button, Edit button
  - Progress bar (color-coded: red for over-budget, orange for near-limit, default otherwise)
  - Remaining text or "Over by: ₹{amount}"
- **View link**: `/dashboard/budget/{categoryName}` — per-category detail page
- **Edit**: Opens `EditBudgetModal` (Dialog) to update budgeted amount with old/new percentage preview
- Data source: `useBudgetCategories()` + `useBudgetOverview()`

### Budget Tips
- 2 tip cards: "Smart Allocation" (50/30/20 rule, blue), "Track Progress" (green)

### Subpages
- `/dashboard/budget/customize` — Manage category symbols/colors, add/edit/delete
- `/dashboard/budget/[categoryName]` — Per-category Budgeted/Spent/Remaining + monthly transactions

---

## Alerts & Notifications (`/dashboard/alerts`)

### File Location
- `components/dashboard/pages/alerts.tsx`
- Route: `/dashboard/alerts`

### Alert Shape
```typescript
{
  id: string
  type: "warning" | "info" | "success" | "error"
  title: string
  message: string
  category: string  // e.g. "Budget", "Bills", "Goals", "Security", "Account", "Investments"
  read: boolean
  timestamp: string
  action_url?: string
}
```

### Summary Cards (4 Cards)
- **Total** — Bell icon (blue), `{alerts.length}`, subtitle "All time"
- **Unread** — AlertTriangle icon (red), `{unreadCount}`, subtitle "Require attention"
- **Read** — CheckCircle icon (green), `{readCount}`, subtitle "Acknowledged"
- **Active Rules** — Settings icon (purple), count of enabled alert settings, subtitle "Monitoring"

### Alert Tabs / Filters
- Tabs: All, Unread, Warnings, Info, Success, Errors
- Unread tab shows badge with unread count

### Alerts List
- Grouped by category (ordered: Budget, Bills, Goals, Security, Account, Investments)
- Each alert:
  - Type icon (AlertTriangle for warning/error, CheckCircle for success, Info for info, Bell for default)
  - Title + "New" badge (for unread alerts)
  - Message text
  - Timestamp (Just now, Xh ago, Yesterday, or locale date)
  - "Mark Read" button (only for unread alerts)
  - Unread alerts have `border-l-4`; read alerts have `opacity-70`

### Inline Alert Settings
- Each setting: Title, Category badge, Description, Threshold display (when applicable), Toggle switch
- Thresholds shown when `setting.enabled` and `setting.threshold != null`
- Toggle calls `useToggleAlertSetting(setting.id)` — persists to backend
- Error state handled with retry button

### Quick Actions (4 Buttons)
1. **Mark All Read** — CheckCircle icon (green), calls `useMarkAllAlertsRead`
2. **Generate Alerts** — Sparkles icon (purple), calls `POST /api/alerts/generate/`
3. **Manage Settings** — Calendar icon (blue), links to `/dashboard/notifications`
4. **Clear All** — Trash2 icon (red), **disabled** (not yet implemented)

### Header Actions
- **Generate** button — calls `POST /api/alerts/generate/`, shows spinner while pending, refreshes alerts
- **Notification Settings** link — navigates to `/dashboard/notifications`

---

## Notification Settings (`/dashboard/notifications`)

### File Location
- `components/dashboard/pages/notification-settings.tsx`
- Route: `/dashboard/notifications`

### Notification Categories (Data-Driven)
| Key | Label | Icon | Backend Setting | Status |
|-----|-------|------|----------------|--------|
| budget | Budget alerts | Wallet | `budget_warning` (category: Budget) | Active |
| category | Category alerts | LayoutGrid | `bill_reminders` (category: Bills) | Active |
| report | Report notifications | FileBarChart | — | Coming soon |
| email | Email notifications | Mail | — | Coming soon |
| browser | Browser notifications | Monitor | — | Coming soon |

### Per-Category Row
- Icon in muted background, label, description
- "Connected to {setting.title}" + threshold info (when mapped to a backend setting)
- "Coming soon" badge for future categories (toggle disabled)
- "Saved" badge briefly shown after successful toggle
- Toggle switch: calls `useToggleAlertSetting(setting.id)`, disabled for future categories or when no setting mapped

### Preferences
- **Reset to defaults** button — calls `useResetAlertSettings()`

### Header
- Title: "Notification Settings" with Bell icon
- Subtitle: "Choose how and when WealthWise notifies you"
- **Back to Alerts** link → `/dashboard/alerts`

---

## Settings Dialog

### File Location
- `components/dashboard/settings-dialog.tsx`
- Opened from sidebar Settings button; local UI state, **NOT yet persisted to backend**

### General Tab
- **Currency Select** — INR (₹), USD ($), EUR (€), GBP (£)
- **Language Select** — English, Hindi, Spanish, French

### Appearance Tab
- **Theme Mode** — 3-button grid: Light, Dark, System (uses `next-themes` `useTheme()`)

### Account Tab
- **Download My Data** — outline button (UI only)
- **Delete My Account** — destructive button with warning alert ("This action cannot be undone...")

---

## Currency, Icons, and Formatting

### Currency Display
- **Symbol**: ₹ (Indian Rupee)
- **Format**: `₹{value.toLocaleString()}` (no explicit `'en-IN'` locale in most components; `toLocaleString()` with defaults)
- **Decimals**: 0 for whole rupees (via `Math.round()` where applicable)

### Icons
- All icons from `lucide-react`
- Common: `Menu`, `Plus`, `Calendar`, `Sparkles`, `Search`, `Download`, `TrendingUp`, `TrendingDown`, `Bell`, `Settings`, `Target`, `PieChart`, `AlertTriangle`, `CheckCircle`, `Info`, `Trash2`, `Edit`, `Eye`, `History`, `ArrowUpRight`, `ArrowDownLeft`, `CalendarClock`, `FileDown`, `FileSpreadsheet`, `Printer`, `Loader2`, `ChevronLeft`, `ChevronRight`, `SkipForward`, `Inbox`, `RefreshCw`, `CheckCheck`, `ArrowLeft`, `RotateCcw`

### UI Components
- Built on `shadcn/ui`: Card, Button, Input, Select, Table, Badge, Progress, Dialog, Sheet, Switch, Label, Separator, Tooltip, Skeleton, Alert, Tabs, Checkbox, DropdownMenu
- Custom shared components: `GlassCard`, `AIInsightsCard`, `MagneticButton`, `CountUp`, `LiveClock`, `CursorEffect`, `DynamicBackground`, `DataStream`

---

## Backend Endpoints

| Endpoint | Method | Used In | Description |
|----------|--------|---------|-------------|
| `/api/transactions/` | GET | Transactions, Reports | List transactions with pagination and filters |
| `/api/transactions/export_csv/` | GET | Reports | Export transactions as CSV |
| `/api/budget-categories/` | GET/PATCH | Budget Planner | List and update budget categories |
| `/api/budget-overview/` | GET | Budget Planner | Get total budgeted/spent/remaining/percentage |
| `/api/goals/` | GET/POST/DELETE | Goals | CRUD for financial goals |
| `/api/goal-progress/` | GET | Goals | Aggregated goal progress |
| `/api/alerts/` | GET | Alerts | List alerts with pagination |
| `/api/alerts/generate/` | POST | Alerts | Trigger backend alert engine |
| `/api/alert-settings/` | GET/PATCH | Alerts, Notification Settings | List and toggle alert settings |
| `/api/reports/generate_pdf/` | GET | Reports | Generate PDF report |
| `/api/reports/filter/` | POST | Reports | Apply trend filters |
| `/api/reports/scheduled/` | GET/POST/PATCH/DELETE | Scheduled Reports | CRUD for scheduled report configurations |
| `/api/reports/scheduled/{id}/trigger/` | GET | Scheduled Reports | Trigger immediate report generation (PDF blob) |
