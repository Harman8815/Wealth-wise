# Goals API Documentation

## Overview

Manage savings goals for various financial objectives. Track progress towards targets with support for different categories, priorities, and statuses.

## Base Endpoint

```
/api/goals/
```

## Endpoints

### 1. List Goals

**Endpoint:** `GET /api/goals/`

**Permission:** IsAuthenticated

**Description:** Get all goals for the authenticated user, ordered by creation date (newest first).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| priority | string | Filter by priority (`low`, `medium`, `high`) |
| status | string | Filter by status (`active`, `completed`, `paused`) |

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "user": 1,
        "title": "Emergency Fund",
        "description": "Build 6 months of expenses as emergency fund",
        "target_amount": 300000.00,
        "current_amount": 285000.00,
        "target_date": "2024-03-25",
        "category": "Emergency",
        "priority": "high",
        "status": "active",
        "created_at": "2022-01-15T10:30:00Z",
        "completed_at": null
    },
    {
        "id": 2,
        "user": 1,
        "title": "Europe Vacation 2024",
        "description": "Save for a 2-week European vacation",
        "target_amount": 250000.00,
        "current_amount": 195000.00,
        "target_date": "2024-07-20",
        "category": "Travel",
        "priority": "medium",
        "status": "active",
        "created_at": "2023-01-20T14:00:00Z",
        "completed_at": null
    }
]
```

---

### 2. Create Goal

**Endpoint:** `POST /api/goals/`

**Permission:** IsAuthenticated

**Description:** Create a new savings goal.

**Request Body:**
```json
{
    "title": "New Car Down Payment",
    "description": "Save for down payment on Hyundai Creta",
    "target_amount": 500000.00,
    "current_amount": 320000.00,
    "target_date": "2024-06-15",
    "category": "Transportation",
    "priority": "high",
    "status": "active"
}
```

**Response (201 Created):**
```json
{
    "id": 3,
    "user": 1,
    "title": "New Car Down Payment",
    "description": "Save for down payment on Hyundai Creta",
    "target_amount": 500000.00,
    "current_amount": 320000.00,
    "target_date": "2024-06-15",
    "category": "Transportation",
    "priority": "high",
    "status": "active",
    "created_at": "2024-01-21T09:00:00Z",
    "completed_at": null
}
```

---

### 3. Get Goal Details

**Endpoint:** `GET /api/goals/{id}/`

**Permission:** IsAuthenticated

**Description:** Get details of a specific goal.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Goal ID |

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "title": "Emergency Fund",
    "description": "Build 6 months of expenses as emergency fund",
    "target_amount": 300000.00,
    "current_amount": 285000.00,
    "target_date": "2024-03-25",
    "category": "Emergency",
    "priority": "high",
    "status": "active",
    "created_at": "2022-01-15T10:30:00Z",
    "completed_at": null
}
```

---

### 4. Update Goal

**Endpoint:** `PUT /api/goals/{id}/`

**Permission:** IsAuthenticated

**Description:** Full update of a goal.

**Request Body:**
```json
{
    "title": "Emergency Fund - Updated",
    "description": "Build 6 months of expenses",
    "target_amount": 350000.00,
    "current_amount": 285000.00,
    "target_date": "2024-04-30",
    "category": "Emergency",
    "priority": "high",
    "status": "active"
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "title": "Emergency Fund - Updated",
    "description": "Build 6 months of expenses",
    "target_amount": 350000.00,
    "current_amount": 285000.00,
    "target_date": "2024-04-30",
    "category": "Emergency",
    "priority": "high",
    "status": "active",
    "created_at": "2022-01-15T10:30:00Z",
    "completed_at": null
}
```

---

### 5. Partial Update Goal

**Endpoint:** `PATCH /api/goals/{id}/`

**Permission:** IsAuthenticated

**Description:** Partial update of a goal. Useful for updating progress or status.

**Request Body:**
```json
{
    "current_amount": 300000.00,
    "status": "completed",
    "completed_at": "2024-01-21"
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "user": 1,
    "title": "Emergency Fund",
    "description": "Build 6 months of expenses as emergency fund",
    "target_amount": 300000.00,
    "current_amount": 300000.00,
    "target_date": "2024-03-25",
    "category": "Emergency",
    "priority": "high",
    "status": "completed",
    "created_at": "2022-01-15T10:30:00Z",
    "completed_at": "2024-01-21T10:00:00Z"
}
```

---

### 6. Delete Goal

**Endpoint:** `DELETE /api/goals/{id}/`

**Permission:** IsAuthenticated

**Description:** Delete a goal permanently.

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
| title | string | Yes | Goal title/name |
| description | string | No | Detailed description |
| target_amount | decimal | Yes | Target savings amount |
| current_amount | decimal | Yes | Current saved amount |
| target_date | date | Yes | Target completion date |
| category | string | Yes | Goal category |
| priority | string | Yes | Priority level |
| status | string | Yes | Current status |
| created_at | datetime | Auto | Creation timestamp |
| completed_at | datetime | No | Completion timestamp |

---

## Goal Categories

| Category | Description |
|----------|-------------|
| `Emergency` | Emergency fund savings |
| `Travel` | Vacation and travel goals |
| `Transportation` | Vehicle-related savings |
| `Technology` | Gadgets and tech purchases |
| `Education` | Learning and education |
| `Home` | Home-related savings |
| `Retirement` | Long-term retirement savings |
| `Wedding` | Wedding fund |
| `Other` | Miscellaneous goals |

---

## Goal Priorities

| Priority | Description |
|----------|-------------|
| `high` | High priority goal |
| `medium` | Medium priority goal |
| `low` | Low priority goal |

---

## Goal Status

| Status | Description |
|--------|-------------|
| `active` | Goal is actively being pursued |
| `completed` | Goal has been achieved |
| `paused` | Goal is temporarily on hold |

---

## Progress Calculation

```
progress_percentage = (current_amount / target_amount) × 100
remaining_amount = target_amount - current_amount
is_completed = current_amount >= target_amount
```

---

## Example Usage

### Create New Goal
```bash
curl -X POST http://localhost:8000/api/goals/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "MacBook Pro M3",
    "description": "New laptop for work and personal use",
    "target_amount": 185000.00,
    "current_amount": 50000.00,
    "target_date": "2024-12-31",
    "category": "Technology",
    "priority": "medium",
    "status": "active"
  }'
```

### Update Goal Progress
```bash
curl -X PATCH http://localhost:8000/api/goals/1/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "current_amount": 150000.00
  }'
```

### Mark Goal as Completed
```bash
curl -X PATCH http://localhost:8000/api/goals/1/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "completed_at": "2024-01-21"
  }'
```

### Filter by Status and Priority
```bash
curl -X GET "http://localhost:8000/api/goals/?status=active&priority=high" \
  -H "Authorization: Bearer <access_token>"
```

---

## Business Logic

- **Progress Tracking:** Progress is calculated automatically based on current vs target amount
- **Milestone Alerts:** System can generate alerts when reaching 25%, 50%, 75%, and 100% milestones
- **Status Updates:** When `current_amount >= target_amount`, consider marking as `completed`
- **Category Matching:** Use consistent categories across goals for better organization
