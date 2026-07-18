# WealthWise API Documentation

## Overview

WealthWise is a comprehensive personal finance management application. This API provides full CRUD operations for managing users, accounts, transactions, budgets, goals, alerts, and expenses.

**Base URL:** `http://localhost:8000/api/`

**Authentication:** JWT (JSON Web Token)

## Table of Contents

1. [Authentication](./authentication.md)
2. [Users API](./users.md)
3. [Accounts API](./accounts.md)
4. [Transactions API](./transactions.md)
5. [Categories API](./users.md) *(shared category system)*
6. [Budget Categories API](./budget-categories.md)
7. [Goals API](./goals.md)
8. [Alerts API](./alerts.md)
9. [Alert Settings API](./alert-settings.md)
10. [Expenses API](./expenses.md)
11. [Projects & RBAC](./projects.md)
12. [Recurring Transactions & Budgets](./projects.md) *(scheduling engine)*
13. [Financial Health Score](../FinancialHealthScore_ENGINE.md) *(engine overview)*
14. [Duplicate Transaction Detection](./duplicates.md)
15. [Dynamic AI Insights](./insights.md)
16. [Subscription Detection](./subscriptions.md)
17. [Reports API](./reports.md)
18. [Utility Endpoints](./utilities.md)

## Quick Start

### 1. Authentication

All API endpoints (except login and health check) require authentication via JWT token.

**Get Token:**
```bash
POST /api/auth/login/
{
    "email": "user@example.com",
    "password": "yourpassword"
}
```

**Use Token:**
```
Authorization: Bearer <your_access_token>
```

### 2. API Endpoints Summary

| Endpoint | Description |
|----------|-------------|
| `/api/users/` | User management |
| `/api/accounts/` | Bank accounts, cards, wallets |
| `/api/transactions/` | Income and expense transactions |
| `/api/categories/` | Shared category system (expense/income/goal/budget) |
| `/api/budget-categories/` | Budget planning categories |
| `/api/goals/` | Savings goals |
| `/api/alerts/` | Notifications and alerts |
| `/api/alert-settings/` | Alert configuration |
| `/api/expenses/` | Quick expense tracking |
| `/api/projects/` | Collaborative finance workspaces + RBAC |
| `/api/recurring/` | Recurring transaction rules (CRUD + lifecycle) |
| `/api/recurring-budgets/` | Recurring budget generation rules |
| `/api/financial-health/` | Financial Health Score (weighted, explainable) |
| `/api/duplicates/` | Duplicate transaction detection (ML) |
| `/api/insights/` | Dynamic AI insights feed |
| `/api/subscriptions/` | Subscription detection (pattern mining) |
| `/api/reports/filter/` | Filtered report data (monthly stats, categories, summary) |
| `/api/reports/export_pdf/` | PDF report summary |
| `/api/reports/generate_pdf/` | Generate PDF report by type |
| `/api/reports/schedules/` | Scheduled reports (list/create) |
| `/api/reports/schedules/{id}/` | Scheduled report detail (get/update/delete) |
| `/api/reports/schedules/{id}/trigger/` | Generate a scheduled report PDF |
| `/api/transactions/export_csv/` | Export transactions as CSV |
| `/api/imports/upload/` · `/api/imports/{id}/commit/` | Bank-statement import (CSV/Excel/PDF) |
| `/api/exports/` | Export jobs (CSV/JSON) |
| `/api/health/` | API health check |
| `/api/seed-data/` | Generate sample data |

## Response Format

All API responses follow this structure:

**Success (200-299):**
```json
{
    "data": { ... },
    "status": "success"
}
```

**Error (400-599):**
```json
{
    "error": "Error description",
    "status": "error",
    "code": 400
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 204 | No Content - Resource deleted |
| 400 | Bad Request - Invalid data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Permission denied |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Internal error |

## Pagination

List endpoints support pagination with these query parameters:

- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 20)

**Example:**
```
GET /api/transactions/?page=2&page_size=50
```

## Filtering

Many endpoints support filtering via query parameters:

**Example:**
```
GET /api/transactions/?category=Food&type=expense&date=2024-01-01
GET /api/goals/?status=active&priority=high
GET /api/alerts/?read=false&type=warning
```

## Support

For API support, contact: support@wealthwise.com
