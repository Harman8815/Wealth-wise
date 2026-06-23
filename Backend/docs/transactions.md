# Transactions API Documentation

## Overview

Manage income and expense transactions. Transactions are linked to accounts and automatically update account balances. Supports filtering by category, type, status, and date.

## Base Endpoint

```
/api/transactions/
```

## Endpoints

### 1. List Transactions

**Endpoint:** `GET /api/transactions/`

**Permission:** IsAuthenticated

**Description:** Get all transactions for the authenticated user, ordered by date (newest first).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| type | string | Filter by type (`income` or `expense`) |
| status | string | Filter by status |
| date | date | Filter by date (YYYY-MM-DD) |

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "user": 1,
        "account": 1,
        "account_name": "HDFC Savings",
        "date": "2024-01-20",
        "description": "Monthly Salary Credit",
        "category": "Income",
        "amount": 85000.00,
        "type": "income",
        "status": "completed",
        "created_at": "2024-01-20T10:30:00Z"
    },
    {
        "id": 2,
        "user": 1,
        "account": 2,
        "account_name": "ICICI Credit Card",
        "date": "2024-01-19",
        "description": "Big Bazaar Grocery",
        "category": "Food & Dining",
        "amount": 2500.00,
        "type": "expense",
        "status": "completed",
        "created_at": "2024-01-19T18:45:00Z"
    }
]
```

---

### 2. Create Transaction

**Endpoint:** `POST /api/transactions/`

**Permission:** IsAuthenticated

**Description:** Create a new transaction. Automatically updates the linked account's balance.

**Request Body:**
```json
{
    "account": 1,
    "date": "2024-01-21",
    "description": "Amazon Purchase",
    "category": "Shopping",
    "amount": 3500.00,
    "type": "expense",
    "status": "completed",
    "account_name": "HDFC Savings"
}
```

**Response (201 Created):**
```json
{
    "id": 3,
    "user": 1,
    "account": 1,
    "account_name": "HDFC Savings",
    "date": "2024-01-21",
    "description": "Amazon Purchase",
    "category": "Shopping",
    "amount": 3500.00,
    "type": "expense",
    "status": "completed",
    "created_at": "2024-01-21T14:30:00Z"
}
```

---

### 3. Get Transaction Details

**Endpoint:** `GET /api/transactions/{id}/`

**Permission:** IsAuthenticated

**Description:** Get details of a specific transaction.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Transaction ID |

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "account": 1,
    "account_name": "HDFC Savings",
    "date": "2024-01-20",
    "description": "Monthly Salary Credit",
    "category": "Income",
    "amount": 85000.00,
    "type": "income",
    "status": "completed",
    "created_at": "2024-01-20T10:30:00Z"
}
```

---

### 4. Update Transaction

**Endpoint:** `PUT /api/transactions/{id}/`

**Permission:** IsAuthenticated

**Description:** Full update of a transaction. Account balance is recalculated.

**Request Body:**
```json
{
    "account": 1,
    "date": "2024-01-21",
    "description": "Updated Description",
    "category": "Shopping",
    "amount": 4000.00,
    "type": "expense",
    "status": "completed",
    "account_name": "HDFC Savings"
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "account": 1,
    "account_name": "HDFC Savings",
    "date": "2024-01-21",
    "description": "Updated Description",
    "category": "Shopping",
    "amount": 4000.00,
    "type": "expense",
    "status": "completed",
    "created_at": "2024-01-20T10:30:00Z"
}
```

---

### 5. Partial Update Transaction

**Endpoint:** `PATCH /api/transactions/{id}/`

**Permission:** IsAuthenticated

**Description:** Partial update of a transaction.

**Request Body:**
```json
{
    "status": "pending"
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "account": 1,
    "account_name": "HDFC Savings",
    "date": "2024-01-21",
    "description": "Updated Description",
    "category": "Shopping",
    "amount": 4000.00,
    "type": "expense",
    "status": "pending",
    "created_at": "2024-01-20T10:30:00Z"
}
```

---

### 6. Delete Transaction

**Endpoint:** `DELETE /api/transactions/{id}/`

**Permission:** IsAuthenticated

**Description:** Delete a transaction. Account balance is recalculated.

**Response (204 No Content):**
```json
{}
```

---

### 7. Get Transaction Summary

**Endpoint:** `GET /api/transactions/summary/`

**Permission:** IsAuthenticated

**Description:** Get income, expense, and net balance summary for the user's transactions.

**Response (200 OK):**
```json
{
    "income": 255000.00,
    "expense": 125750.00,
    "net": 129250.00
}
```

---

## Data Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | integer | Auto | Unique identifier |
| user | integer | Auto | User ID (auto-assigned) |
| account | integer | Yes | Associated account ID |
| account_name | string | Yes | Name of the account |
| date | date | Yes | Transaction date |
| description | string | Yes | Transaction description |
| category | string | Yes | Transaction category |
| amount | decimal | Yes | Transaction amount |
| type | string | Yes | `income` or `expense` |
| status | string | Yes | Transaction status |
| created_at | datetime | Auto | Creation timestamp |

---

## Transaction Types

| Type | Description |
|------|-------------|
| `income` | Money coming in (salary, freelance, etc.) |
| `expense` | Money going out (purchases, bills, etc.) |

---

## Transaction Status

| Status | Description |
|--------|-------------|
| `completed` | Transaction completed |
| `pending` | Transaction pending |
| `cancelled` | Transaction cancelled |

---

## Categories

Common categories include:
- `Income` - Salary, freelance, investments
- `Food & Dining` - Groceries, restaurants, food delivery
- `Transportation` - Fuel, public transport, vehicle maintenance
- `Shopping` - Online shopping, retail stores
- `Entertainment` - Movies, subscriptions, gaming
- `Bills & Utilities` - Electricity, internet, phone bills
- `Healthcare` - Medical expenses, pharmacy
- `Education` - Courses, books, tuition
- `Home & Maintenance` - Repairs, cleaning, utilities

---

## Example Usage

### Create Income Transaction
```bash
curl -X POST http://localhost:8000/api/transactions/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "account": 1,
    "date": "2024-01-21",
    "description": "Freelance Payment",
    "category": "Income",
    "amount": 25000.00,
    "type": "income",
    "status": "completed",
    "account_name": "HDFC Savings"
  }'
```

### Filter Expenses by Category
```bash
curl -X GET "http://localhost:8000/api/transactions/?type=expense&category=Food%20%26%20Dining" \
  -H "Authorization: Bearer <access_token>"
```

### Get Summary
```bash
curl -X GET http://localhost:8000/api/transactions/summary/ \
  -H "Authorization: Bearer <access_token>"
```

---

## Business Logic

- **Balance Updates:** Account balances are automatically updated when transactions are created/updated/deleted
- **Income:** Adds to account balance
- **Expense:** Subtracts from account balance
- **Filtering:** Supports multiple filter parameters simultaneously
- **Sorting:** Results are ordered by date (descending) then by creation time
