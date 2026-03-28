# Authentication API Documentation

## Overview

WealthWise uses JWT (JSON Web Token) authentication. All protected endpoints require a valid access token in the Authorization header.

## Endpoints

### 1. Login (Get Access Token)

**Endpoint:** `POST /api/auth/login/`

**Permission:** Public (No authentication required)

**Description:** Authenticate user and receive JWT access and refresh tokens.

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "yourpassword"
}
```

**Response (200 OK):**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Error Response (401 Unauthorized):**
```json
{
    "detail": "No active account found with the given credentials"
}
```

---

### 2. Refresh Token

**Endpoint:** `POST /api/auth/refresh/`

**Permission:** Public (No authentication required)

**Description:** Obtain a new access token using a valid refresh token.

**Request Body:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Error Response (401 Unauthorized):**
```json
{
    "detail": "Token is invalid or expired",
    "code": "token_not_valid"
}
```

---

## Using Authentication

### Protected Endpoints

Include the access token in the Authorization header for all protected requests:

```
Authorization: Bearer <your_access_token>
```

**Example Request:**
```bash
curl -X GET http://localhost:8000/api/accounts/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

---

## Token Lifecycle

### Access Token
- **Validity:** 60 minutes (configurable)
- **Usage:** Must be included in every API request header
- **Storage:** Store securely (memory preferred over localStorage)

### Refresh Token
- **Validity:** 7 days (configurable)
- **Usage:** Used only to obtain new access tokens
- **Storage:** Store securely (httpOnly cookie or secure storage)

---

## Authentication Flow

```
1. User Login
   POST /api/auth/login/
   → Returns access + refresh tokens

2. API Requests
   Include: Authorization: Bearer <access_token>

3. Token Expired (401)
   POST /api/auth/refresh/
   with: { "refresh": "<refresh_token>" }
   → Returns new access token

4. Refresh Token Expired
   → Redirect to login
```

---

## Error Handling

| Error | HTTP Code | Solution |
|-------|-----------|----------|
| `token_not_valid` | 401 | Refresh access token |
| `token_expired` | 401 | Refresh access token |
| `user_not_found` | 401 | Check credentials |
| `authentication_failed` | 401 | Verify token format |

---

## Security Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** - Never expose in URLs or logs
3. **Implement token refresh** before access token expires
4. **Logout functionality** - Clear tokens on client side
5. **Token rotation** - Consider implementing refresh token rotation for enhanced security
