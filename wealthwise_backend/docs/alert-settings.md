# Alert Settings API Documentation

## Overview

Configure alert preferences and notification settings. Users can enable/disable different types of alerts and set custom thresholds for budget warnings, spending alerts, and balance notifications.

## Base Endpoint

```
/api/alert-settings/
```

## Endpoints

### 1. List Alert Settings

**Endpoint:** `GET /api/alert-settings/`

**Permission:** IsAuthenticated

**Description:** Get all alert settings for the authenticated user.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| enabled | boolean | Filter by enabled status (`true` or `false`) |

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "user": 1,
        "setting_id": "budget_warning",
        "title": "Budget Warnings",
        "description": "Get notified when approaching budget limits",
        "category": "Budget",
        "enabled": true,
        "threshold": 80,
        "threshold_unit": "%",
        "created_at": "2024-01-15T10:30:00Z"
    },
    {
        "id": 2,
        "user": 1,
        "setting_id": "unusual_spending",
        "title": "Unusual Spending Alert",
        "description": "Alert for out-of-pattern transactions",
        "category": "Security",
        "enabled": true,
        "threshold": 15000,
        "threshold_unit": "₹",
        "created_at": "2024-01-15T10:30:00Z"
    },
    {
        "id": 3,
        "user": 1,
        "setting_id": "low_balance",
        "title": "Low Balance Alert",
        "description": "Warning when account falls below threshold",
        "category": "Account",
        "enabled": false,
        "threshold": 5000,
        "threshold_unit": "₹",
        "created_at": "2024-01-15T10:30:00Z"
    }
]
```

---

### 2. Create Alert Setting

**Endpoint:** `POST /api/alert-settings/`

**Permission:** IsAuthenticated

**Description:** Create a new alert setting configuration.

**Request Body:**
```json
{
    "setting_id": "custom_alert",
    "title": "Custom Alert",
    "description": "My custom alert configuration",
    "category": "Other",
    "enabled": true,
    "threshold": 100,
    "threshold_unit": "%"
}
```

**Response (201 Created):**
```json
{
    "id": 4,
    "user": 1,
    "setting_id": "custom_alert",
    "title": "Custom Alert",
    "description": "My custom alert configuration",
    "category": "Other",
    "enabled": true,
    "threshold": 100,
    "threshold_unit": "%",
    "created_at": "2024-01-21T09:00:00Z"
}
```

---

### 3. Get Alert Setting Details

**Endpoint:** `GET /api/alert-settings/{id}/`

**Permission:** IsAuthenticated

**Description:** Get details of a specific alert setting.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Alert Setting ID |

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "setting_id": "budget_warning",
    "title": "Budget Warnings",
    "description": "Get notified when approaching budget limits",
    "category": "Budget",
    "enabled": true,
    "threshold": 80,
    "threshold_unit": "%",
    "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 4. Update Alert Setting

**Endpoint:** `PUT /api/alert-settings/{id}/`

**Permission:** IsAuthenticated

**Description:** Full update of an alert setting.

**Request Body:**
```json
{
    "setting_id": "budget_warning",
    "title": "Budget Warnings - Updated",
    "description": "Get notified when approaching budget limits",
    "category": "Budget",
    "enabled": true,
    "threshold": 85,
    "threshold_unit": "%"
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "setting_id": "budget_warning",
    "title": "Budget Warnings - Updated",
    "description": "Get notified when approaching budget limits",
    "category": "Budget",
    "enabled": true,
    "threshold": 85,
    "threshold_unit": "%",
    "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 5. Partial Update Alert Setting

**Endpoint:** `PATCH /api/alert-settings/{id}/`

**Permission:** IsAuthenticated

**Description:** Partial update of an alert setting. Useful for toggling enabled status or adjusting thresholds.

**Request Body:**
```json
{
    "enabled": false,
    "threshold": 90
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "setting_id": "budget_warning",
    "title": "Budget Warnings",
    "description": "Get notified when approaching budget limits",
    "category": "Budget",
    "enabled": false,
    "threshold": 90,
    "threshold_unit": "%",
    "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 6. Delete Alert Setting

**Endpoint:** `DELETE /api/alert-settings/{id}/`

**Permission:** IsAuthenticated

**Description:** Delete an alert setting permanently.

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
| setting_id | string | Yes | Unique setting identifier |
| title | string | Yes | Alert setting title |
| description | string | Yes | Description of the alert |
| category | string | Yes | Alert category |
| enabled | boolean | Yes | Whether alert is active |
| threshold | integer | No | Trigger threshold value |
| threshold_unit | string | No | Unit of threshold (% or currency) |
| created_at | datetime | Auto | Creation timestamp |

---

## Default Alert Settings

| Setting ID | Title | Category | Default Enabled | Default Threshold | Unit |
|------------|-------|----------|-----------------|-------------------|------|
| `budget_warning` | Budget Warnings | Budget | true | 80 | % |
| `bill_reminders` | Bill Reminders | Bills | true | - | - |
| `goal_milestones` | Goal Milestones | Goals | true | - | - |
| `unusual_spending` | Unusual Spending Alert | Security | true | 15000 | ₹ |
| `low_balance` | Low Balance Alert | Account | false | 5000 | ₹ |

---

## Categories

| Category | Description |
|----------|-------------|
| `Budget` | Budget-related alert settings |
| `Bills` | Bill reminder settings |
| `Goals` | Goal notification settings |
| `Security` | Security alert settings |
| `Account` | Account-related alert settings |
| `Other` | Custom user-defined settings |

---

## Threshold Units

| Unit | Description |
|------|-------------|
| `%` | Percentage threshold (0-100) |
| `₹` | Indian Rupee amount |
| `$` | Dollar amount |
| empty | No threshold (on/off setting) |

---

## Example Usage

### Create Custom Alert Setting
```bash
curl -X POST http://localhost:8000/api/alert-settings/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "setting_id": "savings_target",
    "title": "Monthly Savings Target",
    "description": "Alert when monthly savings goal is reached",
    "category": "Goals",
    "enabled": true,
    "threshold": 100,
    "threshold_unit": "%"
  }'
```

### Toggle Alert Setting
```bash
curl -X PATCH http://localhost:8000/api/alert-settings/3/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true
  }'
```

### Update Threshold
```bash
curl -X PATCH http://localhost:8000/api/alert-settings/2/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "threshold": 20000
  }'
```

### List Enabled Settings
```bash
curl -X GET "http://localhost:8000/api/alert-settings/?enabled=true" \
  -H "Authorization: Bearer <access_token>"
```

### List Budget Settings
```bash
curl -X GET "http://localhost:8000/api/alert-settings/?category=Budget" \
  -H "Authorization: Bearer <access_token>"
```

---

## Business Logic

- **Default Settings:** New users get default settings automatically created during seeding
- **Threshold Behavior:** 
  - `%` thresholds trigger when value reaches/exceeds the percentage
  - `₹` thresholds trigger when amount goes above or below (depending on context)
- **Category Consistency:** Use consistent categories for better organization
- **Setting ID Uniqueness:** `setting_id` should be unique per user
