# WealthWise - System Documentation

**Project**: WealthWise - Personal Finance Management Platform  
**Version**: 1.0.0  
**Last Updated**: March 28, 2026  
**Tech Stack**: Next.js 15 (Frontend) + Django REST Framework (Backend)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Current Functionality](#current-functionality)
4. [Frontend Details](#frontend-details)
5. [Backend Details](#backend-details)
6. [API Endpoints](#api-endpoints)
7. [Database Models](#database-models)
8. [What's Implemented](#whats-implemented)
9. [What's Left / TODO](#whats-left--todo)
10. [Development Guide](#development-guide)

---

## Architecture Overview

WealthWise is a full-stack personal finance management application with:

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Django 5.x with Django REST Framework, JWT Authentication
- **Database**: SQLite (development) / PostgreSQL (production ready)
- **State Management**: TanStack React Query (server state)
- **HTTP Client**: Axios with interceptors for JWT

### Authentication Flow
- JWT-based authentication using `djangorestframework-simplejwt`
- Tokens stored in localStorage (access + refresh)
- Auto-refresh token mechanism via Axios interceptors
- Protected routes via `useIsAuthenticated` hook

---

## Project Structure

```
Wealth wise/
├── Frontend/                          # Next.js Application
│   ├── app/                          # Next.js App Router
│   │   ├── dashboard/                # Dashboard pages
│   │   │   ├── alerts/                 # Alerts page
│   │   │   ├── budget/                 # Budget planner page
│   │   │   ├── goals/                  # Financial goals page
│   │   │   ├── reports/                # Reports page
│   │   │   ├── transactions/           # Transactions page
│   │   │   ├── layout.tsx              # Dashboard layout
│   │   │   └── page.tsx                # Dashboard home
│   │   ├── globals.css                 # Global styles
│   │   ├── layout.tsx                  # Root layout
│   │   └── page.tsx                    # Landing page
│   ├── components/
│   │   ├── dashboard/                  # Dashboard-specific components
│   │   │   ├── expense-tracker.tsx     # Quick expense entry
│   │   │   ├── main-content.tsx        # Main dashboard content
│   │   │   ├── monthly-chart.tsx       # Monthly stats chart
│   │   │   ├── overview-cards.tsx      # Dashboard stat cards
│   │   │   ├── recent-transactions.tsx # Transaction list
│   │   │   ├── settings-dialog.tsx     # Settings modal
│   │   │   ├── sidebar.tsx             # Navigation sidebar
│   │   │   └── pages/                  # Dashboard page components
│   │   │       ├── alerts.tsx          # Alerts management
│   │   │       ├── budget-planner.tsx  # Budget planning
│   │   │       ├── goals.tsx           # Goals tracking
│   │   │       ├── reports.tsx         # Analytics reports
│   │   │       └── transactions.tsx    # Transaction history
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── contact-section.tsx         # Landing page sections
│   │   ├── features-section.tsx
│   │   ├── finance-tips-section.tsx
│   │   ├── footer.tsx
│   │   ├── gallery-section.tsx
│   │   ├── hero-section.tsx
│   │   ├── navbar.tsx
│   │   ├── newsletter-section.tsx
│   │   ├── pricing-section.tsx
│   │   ├── testimonials-section.tsx
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   ├── api/                            # API layer
│   │   ├── client.ts                   # Axios client with interceptors
│   │   ├── provider.tsx                # React Query provider
│   │   ├── query-client.ts             # Query client config + keys
│   │   └── services/                   # API service functions
│   │       ├── accounts.ts
│   │       ├── alert-settings.ts
│   │       ├── alerts.ts
│   │       ├── auth.ts
│   │       ├── budget-categories.ts
│   │       ├── expenses.ts
│   │       ├── goals.ts
│   │       ├── index.ts
│   │       ├── transactions.ts
│   │       └── users.ts
│   ├── hooks/                          # React Query hooks
│   │   ├── index.ts
│   │   ├── use-accounts.ts
│   │   ├── use-alert-settings.ts
│   │   ├── use-alerts.ts
│   │   ├── use-auth.ts
│   │   ├── use-budget-categories.ts
│   │   ├── use-expenses.ts
│   │   ├── use-goals.ts
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── use-transactions.ts
│   │   └── use-users.ts
│   ├── lib/                            # Utilities
│   ├── styles/                         # Additional styles
│   ├── public/                         # Static assets
│   └── reports/                        # Generated reports
│
└── wealthwise_backend/                  # Django Application
    ├── api/                             # Main API app
    │   ├── migrations/
    │   ├── views/                       # ViewSets (split by entity)
    │   │   ├── __init__.py
    │   │   ├── accounts.py
    │   │   ├── alert_settings.py
    │   │   ├── alerts.py
    │   │   ├── budget_categories.py
    │   │   ├── expenses.py
    │   │   ├── goals.py
    │   │   ├── system.py
    │   │   ├── transactions.py
    │   │   └── users.py
    │   ├── __init__.py
    │   ├── admin.py
    │   ├── apps.py
    │   ├── base.py                      # Base classes, pagination, permissions
    │   ├── models.py                    # All data models
    │   ├── serializers.py               # DRF serializers
    │   ├── tests.py
    │   └── urls.py                      # API URL routing
    ├── docs/                           # Additional documentation
    ├── wealthwise_backend/             # Django project settings
    │   ├── __init__.py
    │   ├── settings.py
    │   ├── urls.py
    │   └── wsgi.py
    ├── db.sqlite3                       # SQLite database
    ├── manage.py
    ├── README.md
    └── requirements.txt
```

---

## Current Functionality

### Core Features

#### 1. User Management
- **Registration**: Email-based signup with name, email, password
- **Login**: JWT authentication with access/refresh tokens
- **Profile**: Currency, language, theme preferences
- **Settings**: Update profile information

#### 2. Account Management
- **Account Types**: Bank, Credit Card, Debit Card, Wallet, Cash
- **CRUD Operations**: Create, read, update, delete accounts
- **Balance Tracking**: Track balance per account
- **Summary**: Total balance, breakdown by account type
- **Toggle Active**: Activate/deactivate accounts

#### 3. Transaction Management
- **Transaction Types**: Income, Expense
- **Categories**: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Income
- **Status**: Completed, Pending
- **CRUD Operations**: Full transaction management
- **Filtering**: By category, type, status, date
- **Summary**: Income/expense totals, net flow
- **Analytics**: By category breakdown, monthly statistics
- **Account Linking**: Link transactions to specific accounts

#### 4. Budget Planning
- **Budget Categories**: Create custom budget categories
- **Budget Allocation**: Set budgeted amounts per category
- **Spent Tracking**: Auto-calculate spent from transactions
- **Progress Tracking**: Visual progress bars, percentage used
- **Overview**: Total budgeted, spent, remaining across all categories
- **Over-budget Alerts**: Visual indicators when exceeding budget

#### 5. Financial Goals
- **Goal Categories**: Emergency, Travel, Technology, Transportation, Education, Investment, Other
- **Priority Levels**: High, Medium, Low
- **Status Tracking**: Active, Completed, Paused
- **Progress Tracking**: Percentage complete, amount saved
- **Auto-complete**: Goals auto-mark as completed when target reached
- **Contributions**: Add/remove contributions to goals
- **Target Dates**: Set and track target dates

#### 6. Alerts & Notifications
- **Alert Types**: Warning, Info, Success, Error
- **Categories**: Budget, Bills, Goals, Security, Account, Investments
- **Read/Unread**: Mark alerts as read/unread
- **Bulk Actions**: Mark all as read
- **Unread Count**: Badge showing unread notifications
- **Alert Settings**: Toggle notifications per category
- **Thresholds**: Configurable thresholds for alerts

#### 7. Quick Expense Tracking
- **Fast Entry**: Quick expense logging without full transaction details
- **Categories**: Food, Transport, Shopping, Entertainment, Bills, Healthcare, Other
- **Receipts**: Support for receipt image URLs
- **Recent Expenses**: View recent expenses (last 30 days default)
- **Summary**: Total by category, date range filtering

#### 8. Reports & Analytics
- **Monthly Trends**: Income vs Expense bar charts
- **Category Breakdown**: Pie chart of spending by category
- **Savings Analysis**: Target vs Actual savings line chart
- **Key Metrics**: Average monthly income/expenses/savings
- **Financial Health Score**: Calculated score with breakdown
- **AI Insights**: Placeholder for AI-powered financial advice
- **Export**: Export reports (UI only)

#### 9. Landing Page
- **Sections**: Hero, Features, Finance Tips, Gallery, Testimonials, Pricing, Newsletter, Contact, Footer
- **Responsive**: Mobile-friendly design
- **Dark Mode**: Full dark mode support

---

## Frontend Details

### Tech Stack
- **Framework**: Next.js 15.2.4 with App Router
- **React**: Version 19
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: shadcn/ui + Radix UI primitives
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Toast**: Sonner

### Key Dependencies
```json
{
  "@tanstack/react-query": "^5.95.2",
  "axios": "^1.13.6",
  "date-fns": "4.1.0",
  "lucide-react": "^0.454.0",
  "next-themes": "latest",
  "recharts": "latest",
  "zod": "^3.24.1"
}
```

### State Management Pattern
- **Server State**: TanStack React Query for all API data
- **Cache Strategy**: Automatic invalidation on mutations
- **Optimistic Updates**: Some hooks support optimistic UI updates
- **Pagination**: Built-in pagination support for list endpoints

### Dashboard Navigation
```
/dashboard
├── /                 # Overview (main-content.tsx)
├── /transactions     # Transaction history
├── /budget           # Budget planner
├── /goals            # Financial goals
├── /alerts           # Notifications
└── /reports          # Analytics
```

---

## Backend Details

### Tech Stack
- **Framework**: Django 5.x
- **API**: Django REST Framework 3.14+
- **Auth**: JWT via djangorestframework-simplejwt
- **CORS**: django-cors-headers
- **Filtering**: django-filter
- **DB**: SQLite (dev) / PostgreSQL (production ready)

### Key Dependencies
```
Django>=5.0,<6.0
djangorestframework>=3.14.0
djangorestframework-simplejwt>=5.3.0
django-cors-headers>=4.3.0
django-filter>=23.5
```

### Authentication
- **Login**: POST `/api/auth/login/` - Returns access + refresh tokens
- **Refresh**: POST `/api/auth/refresh/` - Get new access token
- **Protected**: All endpoints (except login/register/health) require JWT

### Permissions
- **IsOwner**: Custom permission ensuring users can only access their own data
- **IsAuthenticated**: Standard DRF authentication check

### Pagination
- **StandardResultsSetPagination**: 20 items per page default
- Consistent pagination across all list endpoints

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | User login (returns tokens) |
| POST | `/api/auth/refresh/` | Refresh access token |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/` | List all users |
| POST | `/api/users/` | Register new user |
| GET | `/api/users/me/` | Get current user |
| GET | `/api/users/{id}/` | Get user by ID |
| PATCH | `/api/users/{id}/` | Update user |
| DELETE | `/api/users/{id}/` | Delete user |

### Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts/` | List user accounts |
| POST | `/api/accounts/` | Create account |
| GET | `/api/accounts/summary/` | Account balance summary |
| GET | `/api/accounts/{id}/` | Get account details |
| PATCH | `/api/accounts/{id}/` | Update account |
| DELETE | `/api/accounts/{id}/` | Delete account |
| POST | `/api/accounts/{id}/toggle_active/` | Toggle active status |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions/` | List transactions (filterable) |
| POST | `/api/transactions/` | Create transaction |
| GET | `/api/transactions/summary/` | Income/expense summary |
| GET | `/api/transactions/by_category/` | Expense by category |
| GET | `/api/transactions/monthly_stats/` | Monthly statistics |
| GET | `/api/transactions/{id}/` | Get transaction |
| PATCH | `/api/transactions/{id}/` | Update transaction |
| DELETE | `/api/transactions/{id}/` | Delete transaction |

### Budget Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budget-categories/` | List categories |
| POST | `/api/budget-categories/` | Create category |
| GET | `/api/budget-categories/overview/` | Budget overview |
| GET | `/api/budget-categories/{id}/` | Get category |
| PATCH | `/api/budget-categories/{id}/` | Update category |
| DELETE | `/api/budget-categories/{id}/` | Delete category |
| POST | `/api/budget-categories/{id}/update_spent/` | Recalculate spent |

### Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals/` | List goals (filterable) |
| POST | `/api/goals/` | Create goal |
| GET | `/api/goals/progress/` | Overall progress summary |
| GET | `/api/goals/{id}/` | Get goal |
| PATCH | `/api/goals/{id}/` | Update goal |
| DELETE | `/api/goals/{id}/` | Delete goal |
| POST | `/api/goals/{id}/contribute/` | Add contribution |
| POST | `/api/goals/{id}/toggle_status/` | Toggle active/paused |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts/` | List alerts (filterable) |
| POST | `/api/alerts/` | Create alert |
| GET | `/api/alerts/unread_count/` | Get unread count |
| GET | `/api/alerts/by_category/` | Alerts by category |
| GET | `/api/alerts/{id}/` | Get alert |
| PATCH | `/api/alerts/{id}/` | Update alert |
| DELETE | `/api/alerts/{id}/` | Delete alert |
| POST | `/api/alerts/{id}/mark_read/` | Mark as read |
| POST | `/api/alerts/{id}/mark_unread/` | Mark as unread |
| POST | `/api/alerts/mark_all_read/` | Mark all as read |

### Alert Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alert-settings/` | List settings |
| POST | `/api/alert-settings/` | Create setting |
| GET | `/api/alert-settings/summary/` | Settings summary |
| GET | `/api/alert-settings/{id}/` | Get setting |
| PATCH | `/api/alert-settings/{id}/` | Update setting |
| DELETE | `/api/alert-settings/{id}/` | Delete setting |
| POST | `/api/alert-settings/{id}/toggle/` | Toggle enabled |
| POST | `/api/alert-settings/reset_defaults/` | Reset to defaults |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses/` | List expenses (filterable) |
| POST | `/api/expenses/` | Create expense |
| GET | `/api/expenses/summary/` | Expense summary |
| GET | `/api/expenses/recent/` | Recent expenses |
| GET | `/api/expenses/{id}/` | Get expense |
| PATCH | `/api/expenses/{id}/` | Update expense |
| DELETE | `/api/expenses/{id}/` | Delete expense |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health/` | Health check |
| POST | `/api/seed-data/` | Seed historical data (testing) |

---

## Database Models

### User (Custom)
```python
- id: UUID (primary key)
- email: String (unique, required)
- name: String (required)
- currency: String (default: 'INR')
- language: String (default: 'en')
- theme: String (default: 'system')
- is_active: Boolean (default: True)
- is_staff: Boolean (default: False)
- email_verified: Boolean (default: False)
- created_at: DateTime
- updated_at: DateTime
- last_login: DateTime
```

### Account
```python
- id: UUID (primary key)
- user: ForeignKey(User)
- name: String
- type: Enum ['bank', 'credit_card', 'debit_card', 'wallet', 'cash']
- balance: Decimal (12, 2)
- currency: String
- is_active: Boolean
- bank_name: String (optional)
- account_number: String (optional)
- created_at: DateTime
- updated_at: DateTime
```

### Transaction
```python
- id: UUID (primary key)
- user: ForeignKey(User)
- account: ForeignKey(Account, nullable)
- date: Date
- description: String (500 chars)
- category: Enum ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Income']
- amount: Decimal (12, 2)
- type: Enum ['income', 'expense']
- status: Enum ['completed', 'pending']
- account_name: String (auto-populated)
- created_at: DateTime
- updated_at: DateTime
```

### BudgetCategory
```python
- id: UUID (primary key)
- user: ForeignKey(User)
- name: String
- budgeted: Decimal (12, 2)
- spent: Decimal (12, 2) (auto-calculated)
- color: String (hex color)
- icon: String (Lucide icon name)
- created_at: DateTime
- updated_at: DateTime

# Computed Properties:
- remaining: budgeted - spent
- percentage_used: (spent / budgeted) * 100
```

### Goal
```python
- id: UUID (primary key)
- user: ForeignKey(User)
- title: String
- description: Text (optional)
- target_amount: Decimal (12, 2)
- current_amount: Decimal (12, 2)
- target_date: Date
- category: Enum ['Emergency', 'Travel', 'Technology', 'Transportation', 'Education', 'Investment', 'Other']
- priority: Enum ['high', 'medium', 'low']
- status: Enum ['active', 'completed', 'paused']
- completed_at: DateTime (nullable)
- created_at: DateTime
- updated_at: DateTime

# Computed Properties:
- percentage_complete: (current_amount / target_amount) * 100

# Auto-behavior:
- Auto-completes when current_amount >= target_amount
```

### Alert
```python
- id: UUID (primary key)
- user: ForeignKey(User)
- type: Enum ['warning', 'info', 'success', 'error']
- title: String
- message: Text
- category: Enum ['Budget', 'Bills', 'Goals', 'Security', 'Account', 'Investments']
- timestamp: DateTime (default: now)
- read: Boolean (default: False)
- read_at: DateTime (nullable)
- action_url: String (optional)
- created_at: DateTime

# Methods:
- mark_as_read(): Sets read=True and read_at=now
```

### AlertSetting
```python
- id: UUID (primary key)
- user: ForeignKey(User)
- setting_id: String (unique per user)
- title: String
- description: Text
- category: Enum ['Budget', 'Bills', 'Goals', 'Security', 'Account', 'Investments']
- enabled: Boolean (default: True)
- threshold: Decimal (nullable)
- threshold_unit: String (e.g., '%', '₹')
- created_at: DateTime
- updated_at: DateTime
```

### Expense
```python
- id: UUID (primary key)
- user: ForeignKey(User)
- date: Date
- category: Enum ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Other']
- amount: Decimal (12, 2)
- note: String (500 chars)
- receipt_url: String (optional)
- created_at: DateTime
- updated_at: DateTime
```

---

## What's Implemented

### ✅ Fully Implemented

1. **Authentication System**
   - JWT login/register
   - Token refresh
   - Protected routes
   - User profile management

2. **Account Management**
   - Full CRUD for all account types
   - Balance summary
   - Toggle active status
   - Account linking to transactions

3. **Transaction System**
   - Income/expense tracking
   - Category management
   - Filtering and pagination
   - Monthly statistics
   - Category breakdown
   - Summary calculations

4. **Budget Planning**
   - Budget category CRUD
   - Visual progress tracking
   - Over-budget indicators
   - Overview dashboard
   - Spent calculation from transactions

5. **Financial Goals**
   - Goal creation and tracking
   - Priority management
   - Progress visualization
   - Auto-completion logic
   - Contribution system
   - Pause/resume goals

6. **Alerts & Notifications**
   - Alert CRUD
   - Read/unread management
   - Bulk mark as read
   - Unread count badge
   - Alert settings management
   - Toggle settings
   - Reset to defaults

7. **Quick Expenses**
   - Fast expense entry
   - Receipt support
   - Recent expenses view
   - Category filtering
   - Summary by date range

8. **Reports & Dashboard**
   - Monthly trend charts
   - Category pie charts
   - Savings analysis
   - Key metrics cards
   - Financial health score

9. **UI/UX**
   - Responsive design
   - Dark mode support
   - Loading skeletons
   - Toast notifications
   - Form validation
   - Mobile navigation

10. **Backend Infrastructure**
    - All models with proper relations
    - All API endpoints
    - JWT authentication
    - Permission system
    - Pagination
    - Filtering
    - Data seeding utility

---

## What's Left / TODO

### 🔧 Backend Improvements

1. **Real-time Notifications**
   - WebSocket support for live alerts
   - Push notification infrastructure
   - Email notification integration

2. **Recurring Transactions**
   - Model for recurring transactions
   - Cron job to auto-create recurring entries
   - Support for weekly/monthly/yearly recurrence

3. **Import/Export**
   - CSV import for transactions
   - PDF report generation
   - Excel export
   - Bank statement import (CSV/OFX)

4. **Advanced Analytics**
   - Spending prediction using ML
   - Anomaly detection
   - Cash flow forecasting
   - Investment tracking

5. **Security Enhancements**
   - Rate limiting
   - 2FA support
   - Email verification
   - Password reset flow
   - Audit logging

6. **Multi-currency Support**
   - Currency conversion API integration
   - Exchange rate tracking
   - Multi-currency accounts

### 🎨 Frontend Enhancements

1. **Forms**
   - Add transaction modal (currently just a button)
   - Add account modal
   - Edit functionality for all entities
   - Form validation improvements

2. **Dashboard Widgets**
   - Real-time account balance cards
   - Upcoming bills widget
   - Spending trend mini-charts
   - Goal progress widgets

3. **Mobile App**
   - PWA support
   - Offline mode
   - Push notifications
   - Biometric auth

4. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support
   - High contrast mode

5. **Performance**
   - Virtual scrolling for large lists
   - Image optimization
   - Code splitting
   - Caching strategies

### 🐛 Known Issues

1. **Frontend**
   - Export button doesn't have actual export functionality
   - Some date formatting inconsistencies
   - Settings dialog not fully connected to API
   - Add Transaction button is non-functional (needs modal)
   - Add Category in budget planner needs full implementation

2. **Backend**
   - No email sending configured
   - No background task processing
   - Budget spent calculation could be optimized
   - No transaction search endpoint (currently client-side filtered)

### 📋 Planned Features

1. **Investment Tracking**
   - Stock portfolio tracking
   - Mutual fund integration
   - Crypto support
   - Investment goals

2. **Bill Management**
   - Bill reminder system
   - Recurring bill tracking
   - Bill payment history
   - Due date notifications

3. **Collaboration**
   - Shared accounts with family
   - Permissions system for shared access
   - Activity logs

4. **AI Features**
   - Spending insights
   - Budget recommendations
   - Goal optimization suggestions
   - Fraud detection

5. **Integrations**
   - Bank API integrations (Plaid, Yodlee)
   - UPI transaction import
   - Tax calculation helpers

---

## Development Guide

### Running the Project

#### Backend
```bash
cd wealthwise_backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
# API available at http://127.0.0.1:8000/api/
```

#### Frontend
```bash
cd Frontend
npm install
npm run dev
# App available at http://localhost:3000
```

### Environment Variables

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

#### Backend (.env)
```
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Testing Data
Use the seed endpoint to generate test data:
```bash
POST /api/seed-data/
Body: { "years": 5 }
```

### Code Style
- **Frontend**: ESLint + Prettier configured
- **Backend**: PEP 8 compliance
- **Commits**: Conventional commits recommended

---

## API Query Examples

### Get Transactions with Filters
```javascript
GET /api/transactions/?category=Food+%26+Dining&type=expense&page=1&page_size=20
```

### Create Transaction
```javascript
POST /api/transactions/
{
  "account": "uuid",
  "date": "2024-03-28",
  "description": "Grocery shopping",
  "category": "Food & Dining",
  "amount": 2500.00,
  "type": "expense",
  "status": "completed"
}
```

### Contribute to Goal
```javascript
POST /api/goals/{id}/contribute/
{
  "amount": 5000
}
```

### Mark Alert Read
```javascript
POST /api/alerts/{id}/mark_read/
```

### Get Monthly Stats
```javascript
GET /api/transactions/monthly_stats/?months=12
```

---

## For Other AI Assistants

When working on this codebase:

1. **Follow existing patterns** - The project uses consistent patterns across all entities
2. **Use React Query** - All server state should use TanStack Query hooks
3. **Respect permissions** - Backend has IsOwner permission on all endpoints
4. **Maintain type safety** - Use TypeScript strictly; avoid `any`
5. **Test with seed data** - Use `/api/seed-data/` endpoint for realistic test data
6. **UI consistency** - Use shadcn/ui components; follow existing design patterns
7. **Dark mode** - Always test components in both light and dark modes
8. **Currency** - Use `₹` symbol with `toLocaleString()` for formatting
9. **Error handling** - Use toast notifications for errors; use skeletons for loading
10. **File structure** - Keep related files together; follow the established directory structure

---

*This documentation is maintained for WealthWise development team and AI assistants.*
