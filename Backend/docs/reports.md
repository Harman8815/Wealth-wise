# Reports API Documentation

## Overview

Endpoints for financial reporting: filtering report data, exporting transactions as CSV, generating PDF reports, and managing scheduled (automated) reports. PDF generation uses **reportlab** (already a project dependency).

**Base URL:** `http://localhost:8000/api/`

---

## Endpoints

### 1. Filter Report Data

**Endpoint:** `POST /api/reports/filter/`

**Permission:** IsAuthenticated

**Description:** Aggregate transactions into monthly stats, category breakdown, and a summary for the given date range / categories.

**Request Body:**
```json
{
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "categories": ["Food & Dining", "Shopping"],
    "time_view": "monthly"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| start_date | date | No | Inclusive lower bound (YYYY-MM-DD) |
| end_date | date | No | Inclusive upper bound (YYYY-MM-DD) |
| categories | string[] | No | Restrict to these category names |
| time_view | string | No | `"monthly"` (default) |

**Response (200 OK):**
```json
{
    "monthly_stats": [
        { "month": "2024-01-01", "income": 85000.0, "expense": 32000.0 },
        { "month": "2024-02-01", "income": 85000.0, "expense": 35000.0 }
    ],
    "by_category": [
        { "category__name": "Food & Dining", "total": 15420.5, "count": 45 }
    ],
    "summary": {
        "income": 170000.0,
        "expense": 67000.0,
        "net": 103000.0
    }
}
```

---

### 2. Export Transactions (CSV)

**Endpoint:** `GET /api/transactions/export_csv/`

**Permission:** IsAuthenticated

**Description:** Download the user's transactions as a CSV file attachment (`transactions.csv`).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | date | Filter from this date |
| end_date | date | Filter up to this date |
| category | string | Filter by category name |
| type | string | `income` or `expense` |

**Response:** `text/csv` attachment with columns: `Date, Description, Category, Type, Amount, Status`.

---

### 3. Export Report Summary (PDF)

**Endpoint:** `GET /api/reports/export_pdf/`

**Permission:** IsAuthenticated

**Description:** Download a PDF summary of monthly income/expense/net as a table.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | date | Filter from this date |
| end_date | date | Filter up to this date |

**Response:** `application/pdf` attachment (`reports.pdf`).

---

### 4. List Scheduled Reports

**Endpoint:** `GET /api/reports/schedules/`

**Permission:** IsAuthenticated

**Description:** List all scheduled reports owned by the current user.

**Response (200 OK):**
```json
[
    {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "user": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        "name": "Weekly Expense Summary",
        "report_type": "monthly_report",
        "frequency": "weekly",
        "enabled": true,
        "last_run": null,
        "next_run": null,
        "created_at": "2026-07-10T12:00:00Z",
        "updated_at": "2026-07-10T12:00:00Z"
    }
]
```

---

### 5. Create Scheduled Report

**Endpoint:** `POST /api/reports/schedules/`

**Permission:** IsAuthenticated

**Description:** Create a scheduled (automated) report.

**Request Body:**
```json
{
    "name": "Weekly Expense Summary",
    "report_type": "monthly_report",
    "frequency": "weekly",
    "enabled": true
}
```

**Report Types (`report_type`):**
| Value | Label |
|-------|-------|
| `budget_summary` | Budget Summary |
| `monthly_report` | Monthly Report |
| `category_analysis` | Category Analysis |
| `spending_trends` | Spending Trends |
| `complete` | Complete Financial Report |

**Frequencies (`frequency`):** `daily`, `weekly`, `monthly`

**Response (201 Created):** The created `ScheduledReport` object.

---

### 6. Scheduled Report Detail

**Endpoint:** `GET|PATCH|DELETE /api/reports/schedules/{id}/`

**Permission:** IsAuthenticated

**Description:**
- `GET` — Retrieve a single scheduled report.
- `PATCH` — Partially update (e.g., `enabled`, `name`, `frequency`, `report_type`).
- `DELETE` — Remove the scheduled report.

**PATCH Request Body (example):**
```json
{ "enabled": false }
```

**Response:** `200 OK` (object) for GET/PATCH, `204 No Content` for DELETE.

---

### 7. Trigger Scheduled Report (Generate PDF)

**Endpoint:** `POST /api/reports/schedules/{id}/trigger/`

**Permission:** IsAuthenticated

**Description:** Immediately generate the report's PDF using `generate_report_pdf()`, update `last_run`/`next_run`, and return the PDF as an attachment named after the report.

**Response:** `application/pdf` attachment (`<report_name>.pdf`).

---

### 8. Generate PDF Report by Type

**Endpoint:** `GET /api/reports/generate_pdf/`

**Permission:** IsAuthenticated

**Description:** Generate and download a PDF report for a given report type on demand.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| type | string | `complete` | One of the `report_type` values above |

**Response:** `application/pdf` attachment (`report_<type>.pdf`).

---

## ScheduledReport Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | uuid | Auto | Unique identifier |
| user | uuid | Auto | Owner (auto-assigned) |
| name | string | Yes | Display name |
| report_type | string | Yes | One of the report types above |
| frequency | string | Yes | `daily`, `weekly`, `monthly` |
| enabled | boolean | Yes | Whether the schedule is active |
| last_run | datetime | No | Last generation timestamp |
| next_run | datetime | No | Next scheduled run |
| created_at / updated_at | datetime | Auto | Timestamps |

PDF generation is modular via `generate_report_pdf(user, report_type)` in `models.py`, so additional templates can be added easily.

---

## Excel Export

Excel (`.xls`) export is handled **on the frontend** (no `openpyxl` dependency). The reports page builds an HTML `<table>` Blob with `application/vnd.ms-excel` mime type, which Excel opens natively. The backend does not currently provide an Excel endpoint.

---

## Example Usage

### Generate a PDF report on demand
```bash
curl -X GET "http://localhost:8000/api/reports/generate_pdf/?type=monthly_report" \
  -H "Authorization: Bearer <access_token>" \
  -o report.pdf
```

### Create a scheduled report
```bash
curl -X POST http://localhost:8000/api/reports/schedules/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Monthly Summary", "report_type": "monthly_report", "frequency": "monthly", "enabled": true }'
```

### Trigger a scheduled report
```bash
curl -X POST http://localhost:8000/api/reports/schedules/<id>/trigger/ \
  -H "Authorization: Bearer <access_token>" \
  -o generated.pdf
```

### Export transactions as CSV
```bash
curl -X GET "http://localhost:8000/api/transactions/export_csv/?type=expense" \
  -H "Authorization: Bearer <access_token>" \
  -o transactions.csv
```
