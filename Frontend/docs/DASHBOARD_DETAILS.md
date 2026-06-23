# WealthWise Dashboard - Detailed Documentation

## Table of Contents
1. [Dashboard Overview](#dashboard-overview)
2. [Dashboard Home (Main)](#dashboard-home-main)
3. [Transactions Page](#transactions-page)
4. [Reports & Insights Page](#reports--insights-page)
5. [Financial Goals Page](#financial-goals-page)
6. [Budget Planner Page](#budget-planner-page)
7. [Alerts Page](#alerts-page)
8. [Data Flow & Hooks](#data-flow--hooks)

---

## Dashboard Overview

### Layout Structure
- **Sidebar Navigation**: Contains links to all dashboard sections with icons
- **Header**: Title, description, and action buttons (Export, Add, etc.)
- **Main Content**: Dynamic content area that changes based on active section
- **Responsive Design**: Mobile-first with collapsible sidebar

### Color Scheme
- **Primary Green**: #10b981 (Income, Positive values)
- **Primary Red**: #ef4444 (Expenses, Negative values)
- **Primary Blue**: #3b82f6 (Active Goals, Navigation)
- **Primary Purple**: #8b5cf6 (Targets, Analytics)
- **Chart Colors**: [#ef4444, #3b82f6, #10b981, #8b5cf6, #f59e0b, #ec4899]

---

## Dashboard Home (Main)

### File Location
- `components/dashboard/main-content.tsx`
- `app/dashboard/page.tsx`

### Overview Cards (4 Cards Grid)

#### 1. Total Balance Card
- **Icon**: Wallet/Account icon
- **Value**: Total of all account balances
- **Trend**: +2.5% from last month
- **Subtitle**: "Available funds"
- **Color Theme**: Blue gradient

#### 2. Monthly Income Card
- **Icon**: TrendingUp (green)
- **Value**: ₹{totalIncome.toLocaleString()}
- **Trend**: Stable indicator
- **Subtitle**: "This month's earnings"
- **Color Theme**: Green (#10b981)

#### 3. Monthly Expenses Card
- **Icon**: TrendingDown (red)
- **Value**: ₹{totalExpenses.toLocaleString()}
- **Trend**: -2.4% from last month
- **Subtitle**: "Total spending"
- **Color Theme**: Red (#ef4444)

#### 4. Net Savings Card
- **Icon**: PieChart/Wallet
- **Value**: ₹{netFlow.toLocaleString()}
- **Formula**: Income - Expenses
- **Trend**: Conditional coloring (green if positive, red if negative)
- **Subtitle**: "Net savings this month"
- **Color Theme**: Dynamic based on value

### Monthly Income vs Expenses Chart
- **Type**: Bar Chart (Recharts)
- **Data Source**: `useMonthlyStats()` hook
- **X-Axis**: Last 6 months (MM format)
- **Y-Axis**: Amount in ₹
- **Bars**:
  - Green bars (#10b981) for Income
  - Red bars (#ef4444) for Expenses
- **Features**:
  - CartesianGrid for readability
  - Tooltip with formatted currency
  - Responsive container

### Recent Transactions Table
- **Data Source**: Latest 5-10 transactions
- **Columns**:
  - Date (formatted)
  - Description with icon (income/expense indicator)
  - Category badge
  - Account name
  - Status badge (completed/pending)
  - Amount (color-coded: green for income, red for expense)
- **Features**:
  - Color-coded type indicators (circular icons)
  - Hover effects
  - Click-through to full transactions page

### Expense Breakdown Mini Chart
- **Type**: Pie Chart or Donut Chart
- **Data Source**: `useTransactionsByCategory()`
- **Display**: Top spending categories
- **Legend**: Category names with percentages

---

## Transactions Page

### File Location
- `components/dashboard/pages/transactions.tsx`
- Route: `/dashboard/transactions`

### Summary Cards (3 Cards)

#### 1. Total Income Card
```
┌─────────────────────────────┐
│  Total Income               │
│  ─────────────────────────  │
│  ₹XX,XXX                    │
│  This month                 │
│  [Green icon]               │
└─────────────────────────────┘
```
- **Color**: Green (#10b981)
- **Data**: `summary?.income`
- **Format**: ₹ with toLocaleString()

#### 2. Total Expenses Card
```
┌─────────────────────────────┐
│  Total Expenses             │
│  ─────────────────────────  │
│  ₹XX,XXX                    │
│  This month                 │
│  [Red icon]                 │
└─────────────────────────────┘
```
- **Color**: Red (#ef4444)
- **Data**: `summary?.expense`
- **Format**: ₹ with toLocaleString()

#### 3. Net Flow Card
```
┌─────────────────────────────┐
│  Net Flow                   │
│  ─────────────────────────  │
│  ₹XX,XXX                    │
│  This month                 │
│  [Dynamic color icon]       │
└─────────────────────────────┘
```
- **Color**: Dynamic (green if ≥0, red if <0)
- **Data**: `summary?.net`
- **Format**: Absolute value with sign indicator

### Filter Transactions Card

#### Filter Controls (4 columns on desktop)
1. **Search Input**
   - Placeholder: "Search transactions..."
   - Icon: Search
   - Filters: description, category
   
2. **Category Select**
   - Options: All, Food & Dining, Transportation, Entertainment, Shopping, Bills & Utilities, Healthcare, Income
   - Default: "All Categories"
   
3. **Type Select**
   - Options: All Types, Income, Expense
   - Default: "All Types"
   
4. **Sort By Select**
   - Options: Date, Amount
   - Default: Date (descending)

### Transaction History Table

#### Table Structure
```
┌────────┬─────────────┬──────────┬─────────┬────────┬─────────┐
│  Date  │ Description │ Category │ Account │ Status │  Amount │
└────────┴─────────────┴──────────┴─────────┴────────┴─────────┘
```

#### Row Data Display
- **Date**: `new Date(transaction.date).toLocaleDateString()`
- **Description**: 
  - Icon: ArrowDownLeft (income) or ArrowUpRight (expense)
  - Color-coded background circle (green/red)
  - Transaction description text
- **Category**: Badge with outline variant
- **Account**: Account name or "-"
- **Status**: 
  - Badge variant: default (completed) or secondary (pending)
  - Text: transaction.status
- **Amount**: 
  - Prefix: "+" for income, "-" for expense
  - Format: ₹{Number(transaction.amount).toLocaleString()}
  - Color: green-600 for income, red-600 for expense

#### Pagination
- 10 items per page
- Current page state tracking
- Total count display: "Showing {filteredTransactions.length} of {totalCount} transactions"

---

## Reports & Insights Page

### File Location
- `components/dashboard/pages/reports.tsx`
- Route: `/dashboard/reports`

### Header Controls
- **Time Period Selector**:
  - Options: Last Month, Last 3 Months, Last 6 Months, Last Year
  - Default: "Last 6 Months"
- **Export Button**: Download report functionality

### Key Metrics Cards (4 Cards)

#### 1. Average Monthly Income
- **Icon**: DollarSign
- **Value**: ₹{Math.round(avgIncome).toLocaleString()}
- **Trend**: "Stable" (green)
- **Calculation**: Sum of all monthly income ÷ number of months
- **Color**: Muted text with green trend

#### 2. Average Monthly Expenses
- **Icon**: TrendingDown
- **Value**: ₹{Math.round(avgExpense).toLocaleString()}
- **Trend**: "-2.4%" (red)
- **Calculation**: Sum of all monthly expenses ÷ number of months
- **Color**: Muted text with red trend

#### 3. Average Savings
- **Icon**: TrendingUp
- **Value**: ₹{Math.round(avgIncome - avgExpense).toLocaleString()}
- **Trend**: "+5.7%" (green)
- **Calculation**: Average Income - Average Expenses
- **Color**: Muted text with green trend

#### 4. Savings Rate
- **Icon**: PieChart
- **Value**: "47.4%" (hardcoded example)
- **Rating**: "Excellent" (green)
- **Calculation**: (Savings ÷ Income) × 100
- **Color**: Muted text with green rating

### Charts Grid (2-column layout on desktop)

#### Chart 1: Income vs Expenses Trend
- **Type**: Bar Chart (Recharts)
- **Title**: "Income vs Expenses Trend"
- **Subtitle**: "Monthly comparison over the last 6 months"
- **Dimensions**: 300px height, responsive width
- **Data Points**:
  ```javascript
  {
    month: "01", // MM format
    income: 45000,
    expenses: 32000,
    savings: 13000
  }
  ```
- **Visual Elements**:
  - CartesianGrid (dashed lines)
  - X-Axis: Month labels
  - Y-Axis: Amount scale
  - Tooltip: Formatted as ₹XX,XXX
  - Green bars (#10b981): Income
  - Red bars (#ef4444): Expenses

#### Chart 2: Expense Breakdown
- **Type**: Pie Chart (Recharts)
- **Title**: "Expense Breakdown"
- **Subtitle**: "Current month spending by category"
- **Dimensions**: 300px height, responsive width
- **Data Points**:
  ```javascript
  {
    name: "Food & Dining",
    value: 15000,
    color: "#ef4444"
  }
  ```
- **Colors**: COLORS array rotation
  - #ef4444 (Red)
  - #3b82f6 (Blue)
  - #10b981 (Green)
  - #8b5cf6 (Purple)
  - #f59e0b (Amber)
  - #ec4899 (Pink)
- **Features**:
  - cx/cy: 50% (centered)
  - Outer radius: 120px
  - Labels: "Category XX%"
  - Tooltip: Formatted as ₹XX,XXX

### Savings Performance Chart
- **Type**: Line Chart (Recharts)
- **Title**: "Savings Performance"
- **Subtitle**: "Target vs actual savings over time"
- **Dimensions**: 300px height, responsive width
- **Data Points**:
  ```javascript
  {
    month: "01",
    target: 22500,  // avgIncome * 0.5
    actual: 13000   // actual savings
  }
  ```
- **Lines**:
  - Dashed gray line (#6b7280): Target savings (50% of income)
  - Solid green line (#10b981, 2px stroke): Actual savings

### Financial Health Section (2-column grid)

#### Card 1: Financial Health Score
- **Layout**: Centered large score display
- **Main Display**: 
  ```
  ┌─────────────────────┐
  │        8.5          │  // Large text (text-6xl)
  │     Excellent       │  // Rating below
  └─────────────────────┘
  ```
- **Sub-scores (4 metrics)**:
  | Metric | Score | Color |
  |--------|-------|-------|
  | Savings Rate | 9/10 | Green |
  | Budget Adherence | 8/10 | Green |
  | Expense Control | 7/10 | Yellow |
  | Goal Progress | 9/10 | Green |

#### Card 2: Key Insights
- **Title**: "Key Insights"
- **Subtitle**: "AI-powered analysis of your financial behavior"
- **Insights Cards (3 items)**:

1. **Great Progress!** (Green theme)
   - Icon: 🎯
   - Message: "Your savings rate of 47.4% is excellent. You're on track to meet your financial goals."
   - Background: bg-green-50 (light), border-green-200

2. **Spending Pattern** (Blue theme)
   - Icon: 📊
   - Message: "Food & Dining is your largest expense category. Consider meal planning to optimize costs."
   - Background: bg-blue-50 (light), border-blue-200

3. **Recommendation** (Purple theme)
   - Icon: 💡
   - Message: "You could increase your emergency fund by redirecting 5% of entertainment spending."
   - Background: bg-purple-50 (light), border-purple-200

---

## Financial Goals Page

### File Location
- `components/dashboard/pages/goals.tsx`
- Route: `/dashboard/goals`

### Header Actions
- **Add Goal Button**: Opens dialog to create new goal

### Add Goal Dialog Form
Fields required for new goal:
| Field | Type | Options/Validation |
|-------|------|-------------------|
| Goal Title | Text Input | Required, placeholder: "e.g., Emergency Fund" |
| Description | Text Input | Optional, placeholder: "Brief description" |
| Target Amount (₹) | Number | Required, placeholder: "100000" |
| Target Date | Date | Required, date picker |
| Category | Select | Emergency, Travel, Technology, Transportation, Education, Investment, Other |
| Priority | Select | High, Medium (default), Low |

### Overview Cards (4 Cards)

#### 1. Active Goals
- **Value**: {activeGoals.length}
- **Subtitle**: "In progress"
- **Color**: Blue (#3b82f6)
- **Data**: Filtered from goals array where status === "active"

#### 2. Completed Goals
- **Value**: {completedGoals.length}
- **Subtitle**: "Achieved"
- **Color**: Green (#10b981)
- **Data**: Filtered from goals array where status === "completed"

#### 3. Total Target
- **Value**: ₹{totalTargetAmount.toLocaleString()}
- **Subtitle**: "All active goals"
- **Color**: Purple (#8b5cf6)
- **Data**: Sum of all active goal target amounts

#### 4. Total Saved
- **Value**: ₹{totalCurrentAmount.toLocaleString()}
- **Subtitle**: "XX.X% of target"
- **Color**: Green (#10b981)
- **Data**: Sum of current amounts across all goals
- **Progress**: Calculated as (totalCurrent / totalTarget) × 100

### Active Goals List

#### Goal Card Structure
```
┌──────────────────────────────────────────────┐
│ 🎯 Title                    [Priority] [Cat] │
│ Description                                  │
│ 📍 ₹XX,XXX target    ⏰ X days/months left   │
│ Progress: ₹X,XXX / ₹XX,XXX      XX.X%         │
│ ████████████░░░░░░░░░░░░░                    │
│ Remaining: ₹XX,XXX    Target: DD/MM/YYYY     │
└──────────────────────────────────────────────┘
```

#### Data Display Per Goal
- **Title**: goal.title
- **Priority Badge**: 
  - High: Red badge
  - Medium: Yellow badge  
  - Low: Green badge
- **Category Badge**: goal.category (outline variant)
- **Description**: goal.description (gray text)
- **Target Amount**: ₹{goal.target_amount.toLocaleString()}
- **Time Remaining**: Dynamic calculation
  - Overdue, Due today, 1 day left, X days left, X months left, X years left
- **Progress Display**:
  - Current: ₹{goal.current_amount.toLocaleString()}
  - Target: ₹{goal.target_amount.toLocaleString()}
  - Percentage: progress.toFixed(1)%
- **Progress Bar**: Shadcn/ui Progress component (h-3)
- **Remaining Amount**: ₹{remaining.toLocaleString()}
- **Target Date**: {new Date(goal.target_date).toLocaleDateString()}

### Completed Goals Section (Conditional)
- Only displays if completedGoals.length > 0
- **Card Style**: Green background (bg-green-50)
- **Layout**: List of completed goal summaries
- **Each Goal Shows**:
  - Title (green-900 text)
  - Description (green-700 text)
  - Amount achieved (green-600, bold)
  - "Completed" badge (green background)

### Goal Achievement Tips Card
- **Layout**: 2-column grid of tip cards

#### Tip 1: Set SMART Goals (Blue)
- Icon: 🎯
- Advice: "Make your goals Specific, Measurable, Achievable, Relevant, and Time-bound for better success rates."
- Colors: Blue theme

#### Tip 2: Automate Savings (Green)
- Icon: 💰
- Advice: "Set up automatic transfers to dedicated goal accounts to ensure consistent progress without manual effort."
- Colors: Green theme

#### Tip 3: Track Progress (Purple)
- Icon: 📊
- Advice: "Review your goals monthly and adjust your savings rate based on income changes and life events."
- Colors: Purple theme

#### Tip 4: Celebrate Milestones (Orange)
- Icon: 🏆
- Advice: "Acknowledge progress at 25%, 50%, and 75% completion to maintain motivation throughout your journey."
- Colors: Orange theme

---

## Budget Planner Page

### File Location
- `components/dashboard/pages/budget-planner.tsx`
- Route: `/dashboard/budget`

### Overview
The Budget Planner page provides comprehensive budget management with category breakdowns and spending limits.

### Budget Summary Cards (4 Cards)

#### 1. Total Budget
- **Icon**: Wallet
- **Value**: Sum of all category budgets
- **Subtitle**: "Allocated across categories"
- **Color**: Blue gradient

#### 2. Spent This Month
- **Icon**: CreditCard
- **Value**: Total expenses across all categories
- **Subtitle**: "Current spending"
- **Color**: Red if over budget, green if under

#### 3. Remaining Budget
- **Icon**: PiggyBank
- **Value**: Budget - Spent
- **Subtitle**: "Available to spend"
- **Color**: Conditional (green/yellow/red based on percentage)

#### 4. Budget Health
- **Icon**: Activity
- **Value**: Percentage spent
- **Subtitle**: Status indicator
  - "On Track" (< 80%)
  - "Warning" (80-95%)
  - "Over Budget" (> 95%)
- **Color**: Dynamic based on percentage

### Category Budget Cards

#### Structure Per Category
```
┌─────────────────────────────────────────────┐
│ [Icon] Category Name              ₹X,XXX    │
│ Spent: ₹X,XXX / ₹X,XXX         XX% used   │
│ ██████████████░░░░░░░░░                    │
│ [Status indicator]  [Adjust budget btn]   │
└─────────────────────────────────────────────┘
```

#### Categories Included
1. **Housing & Rent**
   - Icon: Home
   - Typical allocation: 30-35% of income
   
2. **Food & Dining**
   - Icon: UtensilsCrossed
   - Typical allocation: 15-20% of income
   
3. **Transportation**
   - Icon: Car
   - Typical allocation: 10-15% of income
   
4. **Utilities**
   - Icon: Zap
   - Typical allocation: 5-10% of income
   
5. **Entertainment**
   - Icon: Film
   - Typical allocation: 5-10% of income
   
6. **Shopping**
   - Icon: ShoppingBag
   - Typical allocation: 5-10% of income
   
7. **Healthcare**
   - Icon: Heart
   - Typical allocation: 5-8% of income
   
8. **Savings & Investments**
   - Icon: TrendingUp
   - Typical allocation: 20% of income (50/30/20 rule)

#### Progress Bar States
- **Green** (< 75% spent): Healthy spending
- **Yellow** (75-90% spent): Approaching limit
- **Red** (> 90% spent): Near or over budget

### Monthly Budget Trend Chart
- **Type**: Combined Bar + Line Chart
- **Bars**: Actual spending per category
- **Line**: Budget limit per category
- **X-Axis**: Categories
- **Y-Axis**: Amount (₹)

### Budget Recommendations
AI-powered suggestions based on spending patterns:
- "Reduce dining out by 20% to meet savings goal"
- "You're under budget in Utilities - consider redirecting to Savings"
- "Transportation costs are trending high this month"

---

## Alerts Page

### File Location
- `components/dashboard/pages/alerts.tsx`
- Route: `/dashboard/alerts`

### Overview
Central notification hub for financial alerts, warnings, and reminders.

### Alert Categories (Tabs)

#### 1. All Alerts
- Combined view of all alert types
- Chronological order (newest first)

#### 2. Budget Alerts
Alerts related to budget thresholds:
- Budget threshold reached (80%)
- Budget exceeded (> 100%)
- Unusual spending detected in category

#### 3. Goal Alerts
Alerts for financial goals:
- Goal milestone reached (25%, 50%, 75%)
- Goal deadline approaching (7 days, 1 day)
- Goal completed
- Goal overdue

#### 4. Transaction Alerts
Alerts for account activity:
- Large transaction detected (> threshold)
- Unusual spending pattern
- Duplicate transaction detected
- Recurring payment failed

#### 5. System Alerts
System notifications:
- Account sync issues
- Data import complete
- Report generation complete

### Alert Card Structure
```
┌─────────────────────────────────────────────┐
│ [Icon] Alert Title              [Timestamp] │
│ Alert description text                     │
│ [Action Button]          [Dismiss Button]  │
└─────────────────────────────────────────────┘
```

#### Alert Data Model
```javascript
{
  id: string,
  type: "budget" | "goal" | "transaction" | "system",
  priority: "high" | "medium" | "low",
  title: string,
  description: string,
  created_at: string,
  read: boolean,
  action_url?: string,
  action_label?: string,
  data?: {
    category?: string,
    amount?: number,
    percentage?: number,
    goal_id?: string,
    transaction_id?: string
  }
}
```

#### Priority Indicators
- **High**: Red dot/border - Requires immediate attention
- **Medium**: Yellow/Orange - Should be reviewed soon
- **Low**: Blue/Gray - Informational

#### Icons by Type
- Budget: AlertTriangle or Wallet
- Goal: Target or Trophy
- Transaction: CreditCard or DollarSign
- System: Info or Bell

### Alert Statistics Card
- **Unread Alerts**: Count of unread notifications
- **High Priority**: Count of high-priority items
- **This Week**: New alerts in last 7 days

### Alert Settings
- Toggle email notifications
- Toggle push notifications
- Set budget threshold percentage (default: 80%)
- Set large transaction threshold
- Mute specific categories

---

## Data Flow & Hooks

### Custom Hooks Used Across Dashboard

#### useMonthlyStats(period: number)
**Purpose**: Fetch monthly income/expense statistics
**Returns**:
```javascript
{
  data: [
    {
      month: "2024-01",
      income: 50000,
      expense: 35000,
      net: 15000
    }
  ],
  isLoading: boolean
}
```

#### useTransactions(filters, page, limit)
**Purpose**: Fetch paginated transaction list
**Parameters**:
- filters: { category?, type? }
- page: number
- limit: number
**Returns**:
```javascript
{
  data: {
    results: Transaction[],
    count: number
  },
  isLoading: boolean
}
```

#### useTransactionSummary()
**Purpose**: Get aggregated transaction totals
**Returns**:
```javascript
{
  data: {
    income: number,
    expense: number,
    net: number
  },
  isLoading: boolean
}
```

#### useTransactionsByCategory()
**Purpose**: Get spending grouped by category
**Returns**:
```javascript
{
  data: [
    {
      category: "Food & Dining",
      total: 15000,
      count: 45
    }
  ],
  isLoading: boolean
}
```

#### useGoals()
**Purpose**: Fetch all financial goals
**Returns**:
```javascript
{
  data: {
    results: Goal[],
    count: number
  },
  isLoading: boolean
}
```

#### useGoalProgress()
**Purpose**: Get aggregated goal progress
**Returns**:
```javascript
{
  data: {
    total_target: number,
    total_saved: number,
    percentage: number
  },
  isLoading: boolean
}
```

#### useCreateGoal()
**Purpose**: Mutation hook for creating goals
**Returns**: mutate function with loading/error states

#### useDeleteGoal()
**Purpose**: Mutation hook for deleting goals
**Returns**: mutate function with loading/error states

### Data Refresh Strategy
- **Real-time**: Critical metrics (balance, net flow)
- **On Mount**: Page-specific data
- **Background Refresh**: Every 5 minutes for active sessions
- **Manual Refresh**: Pull-to-refresh or refresh button
- **Optimistic Updates**: For mutations (create/delete/update)

### Loading States
All pages implement consistent loading UI:
- **Skeleton Cards**: 3-4 shimmer cards matching layout
- **Skeleton Charts**: Rectangle placeholders
- **Skeleton Tables**: Row placeholders (3-5 rows)
- **Loading Overlay**: For mutations and form submissions

---

## Common UI Components

### Card Component (Shadcn/ui)
Used throughout dashboard for consistent styling:
```
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Badge Variants
- **default**: Primary action, completed status
- **secondary**: Pending status, neutral info
- **outline**: Categories, tags
- **destructive**: Overdue, error states

### Button Variants
- **default**: Primary actions (Add, Create)
- **outline**: Secondary actions (Export, Cancel)
- **ghost**: Icon buttons, subtle actions
- **destructive**: Delete, Remove

### Icons Used (Lucide React)
- Navigation: Menu, Home, Wallet, Target, PieChart, Bell, Settings
- Actions: Plus, Download, Search, Filter, Trash2, Edit
- Financial: TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownLeft
- Status: AlertTriangle, CheckCircle, Info, AlertCircle
- Categories: UtensilsCrossed, Car, Home, ShoppingBag, Film, Heart, Zap, Briefcase

---

## Currency & Formatting

### Currency Display
- **Symbol**: ₹ (Indian Rupee)
- **Format**: ₹{value.toLocaleString('en-IN')}
- **Decimals**: 0 for whole rupees, 2 for precise amounts
- **Large Numbers**: Use toLocaleString() for comma separators

### Date Formatting
- **Display**: DD/MM/YYYY (Indian format)
- **Internal**: ISO 8601 (YYYY-MM-DD)
- **Relative**: "2 days ago", "Just now", "Last week"

### Percentage Display
- **Format**: XX.X%
- **Calculation**: (part / whole) × 100
- **Precision**: 1 decimal place

---

## Responsive Breakpoints

### Mobile (< 640px)
- Single column layouts
- Collapsible sidebar (drawer)
- Stacked cards
- Simplified charts
- Horizontal scroll for tables

### Tablet (640px - 1024px)
- 2-column grids where applicable
- Persistent sidebar (collapsed)
- Maintained chart complexity

### Desktop (> 1024px)
- Full multi-column layouts
- Expanded sidebar
- Full chart features with legends

---

## Color Themes

### Light Mode
- Background: white / gray-50
- Cards: white
- Text: gray-900 (primary), gray-600 (secondary)
- Borders: gray-200
- Success: green-50 backgrounds, green-600 text
- Warning: yellow-50 backgrounds, yellow-600 text
- Error: red-50 backgrounds, red-600 text
- Info: blue-50 backgrounds, blue-600 text

### Dark Mode
- Background: gray-900 / gray-800
- Cards: gray-800
- Text: white (primary), gray-300 (secondary)
- Borders: gray-700
- Success: green-950 backgrounds, green-400 text
- Warning: yellow-950 backgrounds, yellow-400 text
- Error: red-950 backgrounds, red-400 text
- Info: blue-950 backgrounds, blue-400 text

---

*Documentation generated from code analysis of WealthWise Dashboard*
*Last updated: March 28, 2026*
