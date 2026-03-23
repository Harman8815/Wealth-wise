# Expenses API Documentation

## Overview

Track and manage expenses separately from transactions. Expenses provide a simplified view of spending with basic details like date, category, amount, and optional notes.

## Base Endpoint

```
/api/expenses/
```

## Endpoints

### 1. List Expenses

**Endpoint:** `GET /api/expenses/`

**Permission:** IsAuthenticated

**Description:** Get all expenses for the authenticated user, ordered by date (newest first).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| date | date | Filter by date (YYYY-MM-DD) |

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "user": 1,
        "date": "2024-01-20",
        "category": "Food & Dining",
        "amount": 2500.00,
        "note": "Big Bazaar Grocery",
        "created_at": "2024-01-20T18:45:00Z"
    },
    {
        "id": 2,
        "user": 1,
        "date": "2024-01-19",
        "category": "Transportation",
        "amount": 400.00,
        "note": "Uber ride to office",
        "created_at": "2024-01-19T09:30:00Z"
    }
]
```

---

### 2. Create Expense

**Endpoint:** `POST /api/expenses/`

**Permission:** IsAuthenticated

**Description:** Create a new expense record.

**Request Body:**
```json
{
    "date": "2024-01-21",
    "category": "Shopping",
    "amount": 3500.00,
    "note": "Amazon purchase - headphones"
}
```

**Response (201 Created):**
```json
{
    "id": 3,
    "user": 1,
    "date": "2024-01-21",
    "category": "Shopping",
    "amount": 3500.00,
    "note": "Amazon purchase - headphones",
    "created_at": "2024-01-21T14:30:00Z"
}
```

---

### 3. Get Expense Details

**Endpoint:** `GET /api/expenses/{id}/`

**Permission:** IsAuthenticated

**Description:** Get details of a specific expense.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Expense ID |

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "date": "2024-01-20",
    "category": "Food & Dining",
    "amount": 2500.00,
    "note": "Big Bazaar Grocery",
    "created_at": "2024-01-20T18:45:00Z"
}
```

---

### 4. Update Expense

**Endpoint:** `PUT /api/expenses/{id}/`

**Permission:** IsAuthenticated

**Description:** Full update of an expense record.

**Request Body:**
```json
{
    "date": "2024-01-21",
    "category": "Food & Dining",
    "amount": 2800.00,
    "note": "Updated grocery amount"
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "date": "2024-01-21",
    "category": "Food & Dining",
    "amount": 2800.00,
    "note": "Updated grocery amount",
    "created_at": "2024-01-20T18:45:00Z"
}
```

---

### 5. Partial Update Expense

**Endpoint:** `PATCH /api/expenses/{id}/`

**Permission:** IsAuthenticated

**Description:** Partial update of an expense record.

**Request Body:**
```json
{
    "note": "Updated note only"
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "date": "2024-01-20",
    "category": "Food & Dining",
    "amount": 2500.00,
    "note": "Updated note only",
    "created_at": "2024-01-20T18:45:00Z"
}
```

---

### 6. Delete Expense

**Endpoint:** `DELETE /api/expenses/{id}/`

**Permission:** IsAuthenticated

**Description:** Delete an expense record permanently.

**Response (204 No Content):**
```json
{}
```

---

## Data Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | integer | Auto | Unique identifier |
| user | integer | Auto | User ID (auto-assigned) |
| date | date | Yes | Expense date |
| category | string | Yes | Expense category |
| amount | decimal | Yes | Expense amount |
| note | string | No | Optional description/notes |
| created_at | datetime | Auto | Creation timestamp |

---

## Categories

Common expense categories:

| Category | Description |
|----------|-------------|
| `Food & Dining` | Restaurants, groceries, food delivery |
| `Transportation` | Fuel, rideshare, public transport |
| `Shopping` | Retail, online shopping |
| `Entertainment` | Movies, subscriptions, events |
| `Bills & Utilities` | Electricity, internet, phone |
| `Healthcare` | Medical, pharmacy |
| `Education` | Courses, books, training |
| `Home & Maintenance` | Repairs, cleaning, supplies |
| `Travel` | Hotels, flights, vacation |
| `Other` | Miscellaneous expenses |

---

## Expense vs Transaction

| Feature | Expense | Transaction |
|---------|---------|-------------|
| Account Link | No | Yes |
| Type (income/expense) | Always expense | Both |
| Status | Simple record | Tracked status |
| Balance Impact | None | Updates account balance |
| Use Case | Quick tracking | Full financial records |

---

## Example Usage

### Create Expense
```bash
curl -X POST http://localhost:8000/api/expenses/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-21",
    "category": "Food & Dining",
    "amount": 800.00,
    "note": "Lunch at restaurant"
  }'
```

### List by Category
```bash
curl -X GET "http://localhost:8000/api/expenses/?category=Food%20%26%20Dining" \
  -H "Authorization: Bearer <access_token>"
```

### Update Amount
```bash
curl -X PATCH http://localhost:8000/api/expenses/1/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 3000.00
  }'
```

### Delete Expense
```bash
curl -X DELETE http://localhost:8000/api/expenses/1/ \
  -H "Authorization: Bearer <access_token>"
```

---

## Business Logic

- **No Balance Impact:** Expenses do not affect account balances (unlike transactions)
- **Quick Entry:** Designed for quick expense tracking without account details
- **Category Consistency:** Use same category names as budget categories for reporting
- **Complementary:** Can be created alongside transactions for redundancy or additional tracking
