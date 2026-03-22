# WealthWise - Entity Relationship Diagram (ERD) Report

## Executive Summary

This document describes the data entities and their relationships in the WealthWise budget planner application. Since the application currently uses client-side state management without a backend database, this ERD represents the logical data model that would be implemented in a production system.

---

## Entity Overview

| Entity | Description | Key Attributes |
|--------|-------------|----------------|
| **User** | Application user account | id, name, email, currency, theme |
| **Transaction** | Financial transaction record | id, date, description, category, amount, type |
| **BudgetCategory** | Budget allocation per category | id, name, budgeted, spent, color |
| **Goal** | Savings/financial goal | id, title, targetAmount, currentAmount, targetDate, status |
| **Alert** | Notification/alert item | id, type, title, message, timestamp, read |
| **AlertSetting** | User alert preferences | id, category, enabled, threshold |
| **Expense** | Daily expense tracking | id, date, category, amount, note |
| **Account** | Financial account (bank/card) | id, name, type, balance |

---

## Detailed Entity Specifications

### 1. User Entity

**Description:** Represents a registered user of the WealthWise application

```typescript
interface User {
  id: string              // Primary Key (UUID)
  name: string            // User's display name
  email: string           // Unique email address
  password: string        // Hashed password
  currency: string        // Preferred currency (default: "INR")
  language: string        // Preferred language (default: "en")
  theme: string           // UI theme preference ("light" | "dark" | "system")
  createdAt: DateTime     // Account creation timestamp
  updatedAt: DateTime     // Last update timestamp
  isActive: boolean       // Account status
  emailVerified: boolean  // Email verification status
}
```

**Relationships:**
- One-to-Many with **Transaction** (A user has many transactions)
- One-to-Many with **BudgetCategory** (A user has many budget categories)
- One-to-Many with **Goal** (A user has many goals)
- One-to-Many with **Alert** (A user has many alerts)
- One-to-Many with **AlertSetting** (A user has many alert settings)
- One-to-Many with **Account** (A user has many financial accounts)

---

### 2. Transaction Entity

**Description:** Records all financial transactions (income and expenses)

```typescript
interface Transaction {
  id: string              // Primary Key (UUID)
  userId: string          // Foreign Key → User.id
  date: DateTime          // Transaction date
  description: string     // Transaction description
  category: string        // Category name (enum)
  amount: number          // Transaction amount (positive for income, negative for expense)
  type: TransactionType   // "income" | "expense"
  status: Status          // "completed" | "pending"
  accountId: string       // Foreign Key → Account.id
  account: string         // Account name (denormalized)
  createdAt: DateTime     // Record creation timestamp
  updatedAt: DateTime     // Record update timestamp
}

enum TransactionType {
  INCOME = "income"
  EXPENSE = "expense"
}

enum Status {
  COMPLETED = "completed"
  PENDING = "pending"
}
```

**Categories (Enum):**
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Bills & Utilities
- Healthcare
- Income

**Relationships:**
- Many-to-One with **User** (Each transaction belongs to one user)
- Many-to-One with **Account** (Each transaction belongs to one account)

---

### 3. BudgetCategory Entity

**Description:** Defines budget allocation and tracking per category

```typescript
interface BudgetCategory {
  id: string              // Primary Key (UUID)
  userId: string          // Foreign Key → User.id
  name: string            // Category name
  budgeted: number        // Budgeted amount
  spent: number           // Actual amount spent
  color: string           // Color code for UI (hex)
  icon: string            // Icon identifier (optional)
  createdAt: DateTime     // Record creation timestamp
  updatedAt: DateTime     // Record update timestamp
}
```

**Default Categories:**
| Name | Budgeted | Color |
|------|----------|-------|
| Food & Dining | ₹15,000 | #ef4444 (red) |
| Transportation | ₹8,000 | #3b82f6 (blue) |
| Shopping | ₹10,000 | #10b981 (green) |
| Entertainment | ₹5,000 | #8b5cf6 (purple) |
| Bills & Utilities | ₹12,000 | #f59e0b (orange) |
| Healthcare | ₹3,000 | #ec4899 (pink) |

**Relationships:**
- Many-to-One with **User** (Each budget category belongs to one user)

**Business Rules:**
- spent ≤ budgeted (warning when > 80%)
- Color is required for visualization
- Unique category names per user

---

### 4. Goal Entity

**Description:** Financial savings goals and targets

```typescript
interface Goal {
  id: string              // Primary Key (UUID)
  userId: string          // Foreign Key → User.id
  title: string           // Goal title
  description: string     // Detailed description
  targetAmount: number    // Target savings amount
  currentAmount: number   // Current saved amount
  targetDate: DateTime    // Target completion date
  category: GoalCategory  // Goal category
  priority: Priority      // "high" | "medium" | "low"
  status: GoalStatus      // "active" | "completed" | "paused"
  createdAt: DateTime     // Creation timestamp
  updatedAt: DateTime     // Update timestamp
  completedAt: DateTime   // Completion timestamp (optional)
}

enum GoalCategory {
  EMERGENCY = "Emergency"
  TRAVEL = "Travel"
  TECHNOLOGY = "Technology"
  TRANSPORTATION = "Transportation"
  EDUCATION = "Education"
  INVESTMENT = "Investment"
  OTHER = "Other"
}

enum Priority {
  HIGH = "high"
  MEDIUM = "medium"
  LOW = "low"
}

enum GoalStatus {
  ACTIVE = "active"
  COMPLETED = "completed"
  PAUSED = "paused"
}
```

**Relationships:**
- Many-to-One with **User** (Each goal belongs to one user)

**Business Rules:**
- currentAmount ≤ targetAmount for active goals
- When currentAmount = targetAmount, auto-mark as completed
- targetDate must be in the future for active goals

---

### 5. Alert Entity

**Description:** User notifications and system alerts

```typescript
interface Alert {
  id: string              // Primary Key (UUID)
  userId: string          // Foreign Key → User.id
  type: AlertType         // "warning" | "info" | "success" | "error"
  title: string           // Alert headline
  message: string         // Detailed message
  category: AlertCategory // Alert category
  timestamp: DateTime     // When alert was created
  read: boolean           // Read status
  readAt: DateTime        // When marked as read (optional)
  actionUrl: string       // Link for action (optional)
  createdAt: DateTime     // Creation timestamp
}

enum AlertType {
  WARNING = "warning"
  INFO = "info"
  SUCCESS = "success"
  ERROR = "error"
}

enum AlertCategory {
  BUDGET = "Budget"
  BILLS = "Bills"
  GOALS = "Goals"
  SECURITY = "Security"
  ACCOUNT = "Account"
  INVESTMENTS = "Investments"
}
```

**Relationships:**
- Many-to-One with **User** (Each alert belongs to one user)

**Business Rules:**
- Unread alerts appear first in list
- Auto-delete old alerts after 90 days
- Max 100 alerts per user

---

### 6. AlertSetting Entity

**Description:** User preferences for alert notifications

```typescript
interface AlertSetting {
  id: string              // Primary Key (UUID)
  userId: string          // Foreign Key → User.id
  settingId: string       // Internal setting identifier
  title: string           // Display title
  description: string     // Description text
  category: AlertCategory // Setting category
  enabled: boolean        // Is this alert type enabled
  threshold: number       // Threshold value (optional)
  thresholdUnit: string   // Unit for threshold ("%" | "₹")
  createdAt: DateTime     // Creation timestamp
  updatedAt: DateTime     // Update timestamp
}
```

**Default Settings:**
| Setting ID | Title | Category | Default Enabled | Threshold |
|------------|-------|----------|-----------------|-----------|
| budget_warning | Budget Warnings | Budget | true | 80% |
| bill_reminders | Bill Reminders | Bills | true | - |
| goal_milestones | Goal Milestones | Goals | true | - |
| unusual_spending | Unusual Spending | Security | true | ₹10,000 |
| low_balance | Low Balance Alerts | Account | false | ₹5,000 |
| investment_updates | Investment Updates | Investments | false | - |

**Relationships:**
- Many-to-One with **User** (Each setting belongs to one user)

---

### 7. Expense Entity (Quick Expense)

**Description:** Quick expense tracking for daily expenses

```typescript
interface Expense {
  id: string              // Primary Key (UUID)
  userId: string          // Foreign Key → User.id
  date: DateTime          // Expense date
  category: string        // Expense category
  amount: number          // Expense amount
  note: string            // Description/note
  receiptUrl: string      // Receipt image URL (optional)
  createdAt: DateTime     // Creation timestamp
  updatedAt: DateTime     // Update timestamp
}
```

**Relationships:**
- Many-to-One with **User** (Each expense belongs to one user)

**Business Rules:**
- Amount must be positive
- Note is required for clarity

---

### 8. Account Entity

**Description:** User's financial accounts (banks, cards, wallets)

```typescript
interface Account {
  id: string              // Primary Key (UUID)
  userId: string          // Foreign Key → User.id
  name: string            // Account name
  type: AccountType       // Account type
  balance: number         // Current balance
  currency: string        // Account currency
  isActive: boolean       // Account status
  bankName: string       // Bank/institution name
  accountNumber: string   // Masked account number
  createdAt: DateTime     // Creation timestamp
  updatedAt: DateTime     // Update timestamp
}

enum AccountType {
  BANK = "bank"
  CREDIT_CARD = "credit_card"
  DEBIT_CARD = "debit_card"
  WALLET = "wallet"
  CASH = "cash"
}
```

**Example Accounts:**
| Name | Type | Balance |
|------|------|---------|
| HDFC Bank | Bank | ₹1,00,000 |
| Credit Card | Credit Card | -₹15,670 |
| Debit Card | Debit Card | ₹10,000 |

**Relationships:**
- Many-to-One with **User** (Each account belongs to one user)
- One-to-Many with **Transaction** (Each account has many transactions)

---

## Entity Relationship Diagram (Visual)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ENTITY RELATIONSHIP                            │
│                              DIAGRAM                                     │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │     USER     │
    ├──────────────┤
    │ PK id        │
    │ name         │
    │ email (UQ)   │
    │ password     │
    │ currency     │
    │ theme        │
    │ createdAt    │
    └──────┬───────┘
           │
           │ 1:N
           │
    ┌──────┴───────┐     ┌──────────────┐     ┌──────────────┐
    │  TRANSACTION │     │BUDGETCATEGORY│     │    GOAL      │
    ├──────────────┤     ├──────────────┤     ├──────────────┤
    │ PK id        │     │ PK id        │     │ PK id        │
    │ FK userId    │     │ FK userId    │     │ FK userId    │
    │ FK accountId │     │ name         │     │ title        │
    │ date         │     │ budgeted     │     │ description  │
    │ description  │     │ spent        │     │ targetAmount │
    │ category     │     │ color        │     │ currentAmount│
    │ amount       │     └──────────────┘     │ targetDate   │
    │ type         │                          │ category     │
    │ status       │                          │ priority     │
    └──────┬───────┘                          │ status       │
           │                                  └──────────────┘
           │ N:1
           │
    ┌──────┴───────┐     ┌──────────────┐     ┌──────────────┐
    │   ACCOUNT    │     │    ALERT     │     │ ALERTSETTING │
    ├──────────────┤     ├──────────────┤     ├──────────────┤
    │ PK id        │     │ PK id        │     │ PK id        │
    │ FK userId    │     │ FK userId    │     │ FK userId    │
    │ name         │     │ type         │     │ settingId    │
    │ type         │     │ title        │     │ title        │
    │ balance      │     │ message      │     │ description  │
    │ currency     │     │ category     │     │ category     │
    │ isActive     │     │ timestamp    │     │ enabled      │
    │ bankName     │     │ read         │     │ threshold    │
    └──────────────┘     └──────────────┘     └──────────────┘

           ┌──────────────┐
           │   EXPENSE    │
           ├──────────────┤
           │ PK id        │
           │ FK userId    │
           │ date         │
           │ category     │
           │ amount       │
           │ note         │
           └──────────────┘

LEGEND:
  PK = Primary Key
  FK = Foreign Key
  UQ = Unique Constraint
  1:N = One-to-Many relationship
  N:1 = Many-to-One relationship
```

---

## Database Schema (SQL Representation)

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'system',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    description VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'pending')),
    account VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Budget Categories Table
```sql
CREATE TABLE budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    budgeted DECIMAL(12, 2) NOT NULL DEFAULT 0,
    spent DECIMAL(12, 2) NOT NULL DEFAULT 0,
    color VARCHAR(7) NOT NULL,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);
```

### Goals Table
```sql
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(12, 2) NOT NULL,
    current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    target_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
```

### Alerts Table
```sql
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('warning', 'info', 'success', 'error')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    action_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Alert Settings Table
```sql
CREATE TABLE alert_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    setting_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    threshold DECIMAL(12, 2),
    threshold_unit VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, setting_id)
);
```

### Accounts Table
```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'INR',
    is_active BOOLEAN DEFAULT true,
    bank_name VARCHAR(255),
    account_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Expenses Table (Quick Expense)
```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    note VARCHAR(500) NOT NULL,
    receipt_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Indexes for Performance

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);

-- Transaction queries
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_type ON transactions(type);

-- Budget queries
CREATE INDEX idx_budget_user_id ON budget_categories(user_id);

-- Goal queries
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_target_date ON goals(target_date);

-- Alert queries
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_read ON alerts(read);
CREATE INDEX idx_alerts_timestamp ON alerts(timestamp);

-- Account queries
CREATE INDEX idx_accounts_user_id ON accounts(user_id);

-- Expense queries
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
```

---

## Data Integrity Constraints

| Constraint | Description |
|------------|-------------|
| **Budget Spent Calculation** | spent = SUM(transaction.amount) WHERE category = budget.category AND type = 'expense' |
| **Goal Progress** | currentAmount is updated when linked transactions are added |
| **Alert Generation** | Alerts are auto-generated based on alert_settings rules |
| **Transaction Type Consistency** | income transactions have positive amounts, expense have negative |
| **Account Balance** | balance = SUM(transaction.amount) WHERE account_id = account.id |

---

## Migration Path (Current to Proposed)

### Current State
- Client-side React state using useState
- Static/mock data hardcoded in components
- No persistence between sessions

### Migration Steps
1. Set up PostgreSQL database
2. Create tables with migrations
3. Implement API layer (REST/GraphQL)
4. Add authentication (NextAuth.js/Clerk)
5. Migrate static data to database seeders
6. Replace useState with data fetching (SWR/React Query)
7. Add real-time updates (WebSockets/Server-Sent Events)

---

## Data Volume Estimates

| Entity | Per User (Monthly) | Growth Rate |
|--------|---------------------|-------------|
| Transactions | 50-100 | High |
| Expenses | 30-60 | High |
| Alerts | 10-20 | Medium |
| Budget Categories | 6-10 | Low (mostly static) |
| Goals | 3-5 | Low |
| Accounts | 2-4 | Very Low |

---

*Report generated on: March 22, 2026*
