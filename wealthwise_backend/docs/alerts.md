# Alerts API Documentation

## Overview

Manage notifications and alerts for various financial events including budget warnings, bill reminders, goal milestones, and security alerts.

## Base Endpoint

```
/api/alerts/
```

## Endpoints

### 1. List Alerts

**Endpoint:** `GET /api/alerts/`

**Permission:** IsAuthenticated

**Description:** Get all alerts for the authenticated user, ordered by timestamp (newest first).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Filter by type (`info`, `warning`, `error`, `success`) |
| category | string | Filter by category |
| read | boolean | Filter by read status (`true` or `false`) |

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "user": 1,
        "type": "warning",
        "title": "Budget Alert",
        "message": "You have spent 85% of your Food & Dining budget",
        "category": "Budget",
        "read": false,
        "read_at": null,
        "timestamp": "2024-01-20T18:30:00Z"
    },
    {
        "id": 2,
        "user": 1,
        "type": "info",
        "title": "Bill Reminder",
        "message": "Your electricity bill of ₹2,450 is due in 3 days",
        "category": "Bills",
        "read": false,
        "read_at": null,
        "timestamp": "2024-01-19T09:00:00Z"
    }
]
```

---

### 2. Create Alert

**Endpoint:** `POST /api/alerts/`

**Permission:** IsAuthenticated

**Description:** Create a new alert. Typically used by system or admin functions.

**Request Body:**
```json
{
    "type": "success",
    "title": "Goal Milestone",
    "message": "Congratulations! You have reached 95% of your Emergency Fund goal",
    "category": "Goals",
    "read": false
}
```

**Response (201 Created):**
```json
{
    "id": 3,
    "user": 1,
    "type": "success",
    "title": "Goal Milestone",
    "message": "Congratulations! You have reached 95% of your Emergency Fund goal",
    "category": "Goals",
    "read": false,
    "read_at": null,
    "timestamp": "2024-01-21T10:00:00Z"
}
```

---

### 3. Get Alert Details

**Endpoint:** `GET /api/alerts/{id}/`

**Permission:** IsAuthenticated

**Description:** Get details of a specific alert.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Alert ID |

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "type": "warning",
    "title": "Budget Alert",
    "message": "You have spent 85% of your Food & Dining budget",
    "category": "Budget",
    "read": false,
    "read_at": null,
    "timestamp": "2024-01-20T18:30:00Z"
}
```

---

### 4. Update Alert

**Endpoint:** `PUT /api/alerts/{id}/`

**Permission:** IsAuthenticated

**Description:** Full update of an alert.

**Request Body:**
```json
{
    "type": "warning",
    "title": "Budget Alert - Updated",
    "message": "You have spent 90% of your Food & Dining budget",
    "category": "Budget",
    "read": true,
    "read_at": "2024-01-21T10:00:00Z"
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "type": "warning",
    "title": "Budget Alert - Updated",
    "message": "You have spent 90% of your Food & Dining budget",
    "category": "Budget",
    "read": true,
    "read_at": "2024-01-21T10:00:00Z",
    "timestamp": "2024-01-20T18:30:00Z"
}
```

---

### 5. Partial Update Alert

**Endpoint:** `PATCH /api/alerts/{id}/`

**Permission:** IsAuthenticated

**Description:** Partial update of an alert.

**Request Body:**
```json
{
    "read": true
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "type": "warning",
    "title": "Budget Alert",
    "message": "You have spent 85% of your Food & Dining budget",
    "category": "Budget",
    "read": true,
    "read_at": "2024-01-21T10:15:00Z",
    "timestamp": "2024-01-20T18:30:00Z"
}
```

---

### 6. Delete Alert

**Endpoint:** `DELETE /api/alerts/{id}/`

**Permission:** IsAuthenticated

**Description:** Delete an alert permanently.

**Response (204 No Content):**
```json
{}
```

---

### 7. Mark Alert as Read

**Endpoint:** `POST /api/alerts/{id}/mark_read/`

**Permission:** IsAuthenticated

**Description:** Mark a specific alert as read.

**Response (200 OK):**
```json
{
    "status": "alert marked as read"
}
```

---

### 8. Mark All Alerts as Read

**Endpoint:** `POST /api/alerts/mark_all_read/`

**Permission:** IsAuthenticated

**Description:** Mark all unread alerts as read for the current user.

**Response (200 OK):**
```json
{
    "status": "all alerts marked as read"
}
```

---

## Data Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | integer | Auto | Unique identifier |
| user | integer | Auto | User ID (auto-assigned) |
| type | string | Yes | Alert type/severity |
| title | string | Yes | Alert title |
| message | string | Yes | Alert message/content |
| category | string | Yes | Alert category |
| read | boolean | Yes | Read status |
| read_at | datetime | No | When alert was read |
| timestamp | datetime | Auto | When alert was created |

---

## Alert Types

| Type | Color | Description |
|------|-------|-------------|
| `info` | Blue | Informational message |
| `warning` | Yellow/Orange | Warning that needs attention |
| `error` | Red | Error or critical issue |
| `success` | Green | Success notification |

---

## Alert Categories

| Category | Description |
|----------|-------------|
| `Budget` | Budget-related alerts |
| `Bills` | Bill payment reminders |
| `Goals` | Goal milestone notifications |
| `Security` | Security warnings and alerts |
| `Account` | Account-related notifications |
| `Transactions` | Transaction alerts |
| `System` | System notifications |

---

## Example Usage

### Create Alert
```bash
curl -X POST http://localhost:8000/api/alerts/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "warning",
    "title": "Budget Alert",
    "message": "You have spent 85% of your Food & Dining budget",
    "category": "Budget",
    "read": false
  }'
```

### List Unread Alerts
```bash
curl -X GET "http://localhost:8000/api/alerts/?read=false" \
  -H "Authorization: Bearer <access_token>"
```

### Mark Single Alert as Read
```bash
curl -X POST http://localhost:8000/api/alerts/1/mark_read/ \
  -H "Authorization: Bearer <access_token>"
```

### Mark All Alerts as Read
```bash
curl -X POST http://localhost:8000/api/alerts/mark_all_read/ \
  -H "Authorization: Bearer <access_token>"
```

### Filter by Type and Category
```bash
curl -X GET "http://localhost:8000/api/alerts/?type=warning&category=Budget" \
  -H "Authorization: Bearer <access_token>"
```

---

## Business Logic

- **Auto-Created Alerts:** Many alerts are automatically generated by the system based on user activity
- **Read Tracking:** `read_at` is automatically set when `read` changes from false to true
- **Notification Priority:** Error alerts should be shown first, followed by warnings, info, then success
- **Cleanup:** Consider implementing automatic cleanup of old read alerts after 30 days
