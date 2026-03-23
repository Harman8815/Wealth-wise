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

**Description:** Register a new user account.

**Request Body:**
```json
{
    "email": "newuser@example.com",
    "password": "securepassword123",
    "first_name": "John",
    "last_name": "Doe"
}
```

**Response (201 Created):**
```json
{
    "id": 1,
    "email": "newuser@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
    "email": ["This field is required."],
    "password": ["This field is required."]
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
        "id": 1,
        "email": "user1@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "created_at": "2024-01-15T10:30:00Z"
    },
    {
        "id": 2,
        "email": "user2@example.com",
        "first_name": "Jane",
        "last_name": "Smith",
        "created_at": "2024-01-16T14:20:00Z"
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
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "created_at": "2024-01-15T10:30:00Z"
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
| id | integer | Yes | User ID |

**Response (200 OK):**
```json
{
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "created_at": "2024-01-15T10:30:00Z"
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
    "first_name": "Johnny",
    "last_name": "Doe"
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "email": "updated@example.com",
    "first_name": "Johnny",
    "last_name": "Doe",
    "created_at": "2024-01-15T10:30:00Z"
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
    "first_name": "Johnny"
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "email": "user@example.com",
    "first_name": "Johnny",
    "last_name": "Doe",
    "created_at": "2024-01-15T10:30:00Z"
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
| id | integer | Auto | Unique identifier |
| email | string | Yes | User email (unique) |
| password | string | Yes | Hashed password (write-only) |
| first_name | string | No | User's first name |
| last_name | string | No | User's last name |
| created_at | datetime | Auto | Account creation timestamp |

---

## Validation Rules

- **Email:** Must be valid email format, unique across all users
- **Password:** Minimum 8 characters (configurable in settings)
- **Name fields:** Maximum 150 characters each

---

## Example Usage

### Register New User
```bash
curl -X POST http://localhost:8000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepass123",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:8000/api/users/me/ \
  -H "Authorization: Bearer <access_token>"
```

### Update Profile
```bash
curl -X PATCH http://localhost:8000/api/users/1/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated Name"
  }'
```
