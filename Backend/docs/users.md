# Users API Documentation

## Overview

Manage user accounts and profiles. User registration is public, but all other operations require authentication.

## Base Endpoint

```
/api/users/
```

## Endpoints

### 1. Create User (Register)

**Endpoint:** `POST /api/users/`

**Permission:** Public (AllowAny)

**Description:** Register a new user account. On success, creates a default "Personal Finance" project and makes the user the owner.

**Request Body:**
```json
{
    "email": "newuser@example.com",
    "password": "securepassword123",
    "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newuser@example.com",
    "name": "John Doe",
    "currency": "INR",
    "language": "en",
    "theme": "system",
    "email_verified": false,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
    "email": ["This field is required."],
    "password": ["This field is required."],
    "name": ["This field is required."]
}
```

---

### 2. List Users

**Endpoint:** `GET /api/users/`

**Permission:** IsAuthenticated

**Description:** Get list of all users. (Admin use)

**Response (200 OK):**
```json
[
    {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user1@example.com",
        "name": "John Doe",
        "currency": "INR",
        "language": "en",
        "theme": "system",
        "email_verified": true,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-20T14:45:00Z"
    }
]
```

---

### 3. Get Current User (Me)

**Endpoint:** `GET /api/users/me/`

**Permission:** IsAuthenticated

**Description:** Get the currently authenticated user's profile.

**Response (200 OK):**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "currency": "INR",
    "language": "en",
    "theme": "system",
    "email_verified": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:45:00Z"
}
```

---

### 4. Get User Details

**Endpoint:** `GET /api/users/{id}/`

**Permission:** IsAuthenticated

**Description:** Get details of a specific user.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | uuid | Yes | User ID |

**Response (200 OK):**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "currency": "INR",
    "language": "en",
    "theme": "system",
    "email_verified": true,
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

### 5. Update User

**Endpoint:** `PUT /api/users/{id}/`

**Permission:** IsAuthenticated

**Description:** Full update of user profile.

**Request Body:**
```json
{
    "email": "updated@example.com",
    "name": "Johnny Doe",
    "currency": "USD",
    "language": "en",
    "theme": "dark"
}
```

**Response (200 OK):**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "updated@example.com",
    "name": "Johnny Doe",
    "currency": "USD",
    "language": "en",
    "theme": "dark",
    "email_verified": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:45:00Z"
}
```

---

### 6. Partial Update User

**Endpoint:** `PATCH /api/users/{id}/`

**Permission:** IsAuthenticated

**Description:** Partial update of user profile.

**Request Body:**
```json
{
    "name": "Johnny Doe"
}
```

**Response (200 OK):**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "Johnny Doe",
    "currency": "INR",
    "language": "en",
    "theme": "system",
    "email_verified": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:45:00Z"
}
```

---

### 7. Delete User

**Endpoint:** `DELETE /api/users/{id}/`

**Permission:** IsAuthenticated

**Description:** Delete user account permanently.

**Response (204 No Content):**
```json
{}
```

---

## Data Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | uuid | Auto | Unique identifier |
| email | string | Yes | User email (unique) |
| password | string | Yes | Hashed password (write-only) |
| name | string | Yes | User's full name (max 255 chars) |
| currency | string | No | Preferred currency code (default: INR) |
| language | string | No | Preferred language code (default: en) |
| theme | string | No | UI theme preference: light, dark, system (default: system) |
| email_verified | boolean | Auto | Whether email has been verified |
| created_at | datetime | Auto | Account creation timestamp |
| updated_at | datetime | Auto | Last update timestamp |
| last_login | datetime | Auto | Last login timestamp |

---

## Validation Rules

- **Email:** Must be valid email format, unique across all users
- **Password:** Minimum 8 characters
- **Name:** Required, max 255 characters

---

## Example Usage

### Register New User
```bash
curl -X POST http://localhost:8000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepass123",
    "name": "John Doe"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:8000/api/users/me/ \
  -H "Authorization: Bearer <access_token>"
```

### Update Profile
```bash
curl -X PATCH http://localhost:8000/api/users/me/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name"
  }'
```
