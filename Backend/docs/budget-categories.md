# Budget Categories API Documentation

## Overview

Manage budget categories for expense tracking and planning. Each category has a budgeted amount and tracks actual spending against the budget.

## Base Endpoint

```
/api/budget-categories/
```

## Endpoints

### 1. List Budget Categories

**Endpoint:** `GET /api/budget-categories/`

**Permission:** IsAuthenticated

**Description:** Get all budget categories for the authenticated user.

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "user": 1,
        "name": "Food & Dining",
        "budgeted": 18000.00,
        "spent": 15420.50,
        "color": "#ef4444",
        "icon": "utensils",
        "created_at": "2024-01-15T10:30:00Z"
    },
    {
        "id": 2,
        "user": 1,
        "name": "Transportation",
        "budgeted": 12000.00,
        "spent": 8750.00,
        "color": "#3b82f6",
        "icon": "car",
        "created_at": "2024-01-15T10:30:00Z"
    }
]
```

---

### 2. Create Budget Category

**Endpoint:** `POST /api/budget-categories/`

**Permission:** IsAuthenticated

**Description:** Create a new budget category.

**Request Body:**
```json
{
    "name": "Entertainment",
    "budgeted": 8000.00,
    "color": "#8b5cf6",
    "icon": "film"
}
```

**Response (201 Created):**
```json
{
    "id": 3,
    "user": 1,
    "name": "Entertainment",
    "budgeted": 8000.00,
    "spent": 0.00,
    "color": "#8b5cf6",
    "icon": "film",
    "created_at": "2024-01-21T09:00:00Z"
}
```

---

### 3. Get Budget Category Details

**Endpoint:** `GET /api/budget-categories/{id}/`

**Permission:** IsAuthenticated

**Description:** Get details of a specific budget category.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Category ID |

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "name": "Food & Dining",
    "budgeted": 18000.00,
    "spent": 15420.50,
    "color": "#ef4444",
    "icon": "utensils",
    "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 4. Update Budget Category

**Endpoint:** `PUT /api/budget-categories/{id}/`

**Permission:** IsAuthenticated

**Description:** Full update of a budget category.

**Request Body:**
```json
{
    "name": "Food & Dining - Updated",
    "budgeted": 20000.00,
    "color": "#ef4444",
    "icon": "utensils"
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "name": "Food & Dining - Updated",
    "budgeted": 20000.00,
    "spent": 15420.50,
    "color": "#ef4444",
    "icon": "utensils",
    "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 5. Partial Update Budget Category

**Endpoint:** `PATCH /api/budget-categories/{id}/`

**Permission:** IsAuthenticated

**Description:** Partial update of a budget category.

**Request Body:**
```json
{
    "budgeted": 25000.00
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "name": "Food & Dining",
    "budgeted": 25000.00,
    "spent": 15420.50,
    "color": "#ef4444",
    "icon": "utensils",
    "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 6. Delete Budget Category

**Endpoint:** `DELETE /api/budget-categories/{id}/`

**Permission:** IsAuthenticated

**Description:** Delete a budget category permanently.

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
| name | string | Yes | Category name |
| budgeted | decimal | Yes | Budget allocation amount |
| spent | decimal | Auto | Amount spent (auto-calculated) |
| color | string | No | Color code for UI (hex format) |
| icon | string | No | Icon identifier for UI |
| created_at | datetime | Auto | Creation timestamp |

---

## Predefined Categories

| Category | Default Color | Icon |
|----------|---------------|------|
| Food & Dining | #ef4444 | utensils |
| Transportation | #3b82f6 | car |
| Shopping | #10b981 | shopping-bag |
| Entertainment | #8b5cf6 | film |
| Bills & Utilities | #f59e0b | receipt |
| Healthcare | #ec4899 | heart-pulse |
| Education | #14b8a6 | graduation-cap |
| Home & Maintenance | #f97316 | home |

---

## Icon Options

Available icon identifiers include:
- `utensils` - Food & dining
- `car` - Transportation
- `shopping-bag` - Shopping
- `film` - Entertainment
- `receipt` - Bills
- `heart-pulse` - Healthcare
- `graduation-cap` - Education
- `home` - Home maintenance
- `plane` - Travel
- `gift` - Gifts
- `smartphone` - Technology
- `more` - Other categories

---

## Budget Tracking

The `spent` field is automatically calculated based on transactions in that category:

```
spent = SUM of all expense transactions in this category
remaining = budgeted - spent
percentage_used = (spent / budgeted) × 100
```

---

## Example Usage

### Create Budget Category
```bash
curl -X POST http://localhost:8000/api/budget-categories/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Entertainment",
    "budgeted": 8000.00,
    "color": "#8b5cf6",
    "icon": "film"
  }'
```

### Update Budget Amount
```bash
curl -X PATCH http://localhost:8000/api/budget-categories/1/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "budgeted": 25000.00
  }'
```

### List All Categories
```bash
curl -X GET http://localhost:8000/api/budget-categories/ \
  -H "Authorization: Bearer <access_token>"
```

---

## Business Logic

- **Spent Calculation:** The `spent` field is automatically updated when transactions are added/updated/deleted
- **Budget Alerts:** System can alert when spending approaches budget limit (80% by default)
- **Category Matching:** Transaction categories should match budget category names for accurate tracking
