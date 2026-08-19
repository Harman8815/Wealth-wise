# Backend read endpoints confirmed for ML-Backend tool functions

All endpoints are under `/api/` and require a valid JWT in the
`Authorization: Bearer <token>` header.

## User
- `GET /api/users/me/` — current user profile

## Accounts / balances
- `GET /api/accounts/` — list accounts
- `GET /api/accounts/summary/` — `{ total_balance, account_count, by_type }`

## Transactions
- `GET /api/transactions/` — list transactions
  - Filters: `category`, `type` (`income`/`expense`), `status`, `date`
  - Pagination: `page`, `page_size`
- `GET /api/transactions/summary/` — `{ income, expense, net, transaction_count }`
  - Optional filters: `start_date`, `end_date`

## Budgets
- `GET /api/budget-categories/` — list budget categories

## Goals
- `GET /api/goals/` — list goals

## Income
- No dedicated income endpoint; income is derived from
  `GET /api/transactions/summary/` or `GET /api/transactions/?type=income`.
