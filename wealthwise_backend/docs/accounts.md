# Accounts API Documentation

## Overview

Manage financial accounts including bank accounts, credit cards, debit cards, wallets, and cash. All accounts are user-specific and require authentication.

## Base Endpoint

```
/api/accounts/
```

## Endpoints

### 1. List Accounts

**Endpoint:** `GET /api/accounts/`

**Permission:** IsAuthenticated

**Description:** Get all accounts belonging to the authenticated user.

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "user": 1,
        "name": "HDFC Savings",
        "type": "bank",
        "bank_name": "HDFC Bank",
        "balance": 125000.00,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-20T14:45:00Z"
    },
    {
        "id": 2,
        "user": 1,
        "name": "ICICI Credit Card",
        "type": "credit_card",
        "bank_name": "ICICI Bank",
        "balance": -15670.00,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-20T14:45:00Z"
    }
]
```

---

### 2. Create Account

**Endpoint:** `POST /api/accounts/`

**Permission:** IsAuthenticated

**Description:** Create a new financial account. The user is automatically assigned from the authenticated user.

**Request Body:**
```json
{
    "name": "SBI Salary Account",
    "type": "bank",
    "bank_name": "State Bank of India",
    "balance": 85000.00
}
```

**Response (201 Created):**
```json
{
    "id": 3,
    "user": 1,
    "name": "SBI Salary Account",
    "type": "bank",
    "bank_name": "State Bank of India",
    "balance": 85000.00,
    "created_at": "2024-01-21T09:00:00Z",
    "updated_at": "2024-01-21T09:00:00Z"
}
```

---

### 3. Get Account Details

**Endpoint:** `GET /api/accounts/{id}/`

**Permission:** IsAuthenticated

**Description:** Get details of a specific account.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Account ID |

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "name": "HDFC Savings",
    "type": "bank",
    "bank_name": "HDFC Bank",
    "balance": 125000.00,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:45:00Z"
}
```

**Error Response (404 Not Found):**
```json
{
    "detail": "Not found."
}
```

---

### 4. Update Account

**Endpoint:** `PUT /api/accounts/{id}/`

**Permission:** IsAuthenticated

**Description:** Full update of account details.

**Request Body:**
```json
{
    "name": "HDFC Savings - Updated",
    "type": "bank",
    "bank_name": "HDFC Bank",
    "balance": 150000.00
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "name": "HDFC Savings - Updated",
    "type": "bank",
    "bank_name": "HDFC Bank",
    "balance": 150000.00,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-21T10:00:00Z"
}
```

---

### 5. Partial Update Account

**Endpoint:** `PATCH /api/accounts/{id}/`

**Permission:** IsAuthenticated

**Description:** Partial update of account details.

**Request Body:**
```json
{
    "balance": 130000.00
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "name": "HDFC Savings",
    "type": "bank",
    "bank_name": "HDFC Bank",
    "balance": 130000.00,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-21T10:15:00Z"
}
```

---

### 6. Delete Account

**Endpoint:** `DELETE /api/accounts/{id}/`

**Permission:** IsAuthenticated

**Description:** Delete an account permanently. Note: This may fail if the account has associated transactions.

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
| name | string | Yes | Account name/display name |
| type | string | Yes | Account type (see below) |
| bank_name | string | Yes | Bank or provider name |
| balance | decimal | Yes | Current balance (negative for credit) |
| created_at | datetime | Auto | Creation timestamp |
| updated_at | datetime | Auto | Last update timestamp |

---

## Account Types

| Type | Description |
|------|-------------|
| `bank` | Savings/Current bank account |
| `credit_card` | Credit card account |
| `debit_card` | Debit card |
| `wallet` | Digital wallet (Paytm, PhonePe, etc.) |
| `cash` | Physical cash |

---

## Validation Rules

- **name:** Maximum 100 characters
- **bank_name:** Maximum 100 characters
- **balance:** Decimal with 2 decimal places
- **type:** Must be one of the allowed account types
- **User isolation:** Users can only access their own accounts

---

## Example Usage

### Create Bank Account
```bash
curl -X POST http://localhost:8000/api/accounts/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SBI Salary Account",
    "type": "bank",
    "bank_name": "State Bank of India",
    "balance": 85000.00
  }'
```

### List All Accounts
```bash
curl -X GET http://localhost:8000/api/accounts/ \
  -H "Authorization: Bearer <access_token>"
```

### Update Balance
```bash
curl -X PATCH http://localhost:8000/api/accounts/1/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "balance": 130000.00
  }'
```

### Delete Account
```bash
curl -X DELETE http://localhost:8000/api/accounts/3/ \
  -H "Authorization: Bearer <access_token>"
```

---

## Business Logic

- **Balance Updates:** Account balances are automatically updated when transactions are created/updated/deleted
- **Negative Balances:** Credit cards may have negative balances representing outstanding dues
- **User Isolation:** Users cannot access or modify other users' accounts
