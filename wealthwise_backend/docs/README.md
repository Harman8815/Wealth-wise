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
5. [Budget Categories API](./budget-categories.md)
6. [Goals API](./goals.md)
7. [Alerts API](./alerts.md)
8. [Alert Settings API](./alert-settings.md)
9. [Expenses API](./expenses.md)
10. [Utility Endpoints](./utilities.md)

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
| `/api/budget-categories/` | Budget planning categories |
| `/api/goals/` | Savings goals |
| `/api/alerts/` | Notifications and alerts |
| `/api/alert-settings/` | Alert configuration |
| `/api/expenses/` | Expense tracking |
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
