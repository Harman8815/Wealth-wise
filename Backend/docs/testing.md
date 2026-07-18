# Backend Testing Infrastructure

Comprehensive API test suite for the WealthWise Django/DRF backend. This setup is
intended to live on the `feature/backend-testing` branch in isolation from feature work.

## Stack

- `pytest` + `pytest-django` — test runner / Django harness
- `factory_boy` — reusable test-data factories (`api/tests/factories.py`)
- `pytest-cov` + `coverage` — coverage reports
- `allure-pytest` — dashboard reporting (preferred)
- `pytest-html` — simple HTML fallback report
- `responses` — external HTTP mocking (available for future external-API tests)

## Layout

```
Backend/
├── pytest.ini              # runner config, markers, coverage addopts
├── .coveragerc             # coverage source + omit + fail_under
├── api/tests/
│   ├── __init__.py
│   ├── conftest.py         # fixtures: api_client, auth_client, project_client, get_tokens_for_user
│   ├── factories.py        # factory_boy factories for every model
│   ├── tests_recurring_budgets.py  # preserved service-layer tests
│   ├── test_auth.py
│   ├── test_users.py
│   ├── test_accounts.py
│   ├── test_transactions.py
│   ├── test_categories.py
│   ├── test_budget_categories.py
│   ├── test_goals.py
│   ├── test_alerts.py
│   ├── test_alert_settings.py
│   ├── test_expenses.py
│   ├── test_recurring.py
│   ├── test_recurring_budgets.py
│   ├── test_projects.py
│   ├── test_data_io.py
│   ├── test_reports.py
│   ├── test_system.py
│   └── test_permissions.py
├── docs/testing.md         # this file
└── Makefile                # command surface
```

## Writing a new test (factory → fixture → request → assert)

```python
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestSomething:
    def test_create(self, project_client, user, project):
        response = project_client.post(
            '/api/things/',
            {'name': 'X'},
            format='json',
            HTTP_X_PROJECT_ID=str(project.id),
        )
        assert response.status_code == status.HTTP_201_CREATED
```

Key fixtures (see `conftest.py`):

- `api_client` — unauthenticated DRF `APIClient`.
- `auth_client` — authenticated client (JWT Bearer) for the default user.
- `project_client` — authenticated client with the `X-Project-Id` header set to the
  user's project, so project-scoped views resolve `request.active_project`.
- `other_user` — a second user (password `testpass123`) for isolation/RBAC tests.
- `user`, `project`, `category`, `account`, `transaction`, `goal`, `alert`,
  `alert_setting`, `expense`, `budget_category`, `scheduled_report`, `recurring_rule`,
  `recurring_budget`, `invitation`, ... — ready-made objects.

## Running tests

```bash
# activate the venv first
cd Backend
venv\Scripts\python -m pytest                 # everything + coverage

pytest api/tests/test_transactions.py         # one domain
pytest -m auth                                # by marker
pytest -m rbac -m project_isolation           # multiple markers
pytest --cov=api --cov-report=html            # coverage html
pytest --html=report.html                     # simple html report
pytest --alluredir=allure-results             # allure results
```

Markers: `auth`, `rbac`, `project_isolation`, `pagination`, `filtering`,
`validation`, `service`, `regression` (declared in `pytest.ini`).

## Reports

- **Coverage HTML:** `htmlcov/index.html` (open locally after a `--cov-report=html` run).
- **Coverage XML:** `coverage.xml` (for CI integration).
- **Allure:** `pytest --alluredir=allure-results` then `allure serve allure-results`.
  The report is generated entirely from backend artifacts.
- **Simple HTML:** `pytest --html=report.html`.

## Coverage status

Current overall API coverage is reported by `pytest` (see the TOTAL line). View-level
coverage is high (most views 85–100%). The `services/` package (alert engine, data
import/export, scheduling, recurring generation) is partially covered; `fail_under` in
`.coveragerc` is set to a conservative **75%** initial line and is intended to be raised
toward 80% as service-layer tests are added.

## CI

`.github/workflows/backend-tests.yml` runs `pytest` with coverage on push/PR to
`feature/backend-testing`. It is minimal and CI-ready but does not need to run locally.
