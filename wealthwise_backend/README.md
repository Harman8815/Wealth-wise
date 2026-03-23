# 🏦 WealthWise Backend API

<p align="center">
  <img src="https://img.shields.io/badge/Django-5.2.8-green?logo=django&style=for-the-badge" alt="Django">
  <img src="https://img.shields.io/badge/Django%20REST%20Framework-3.15-red?logo=django&style=for-the-badge" alt="DRF">
  <img src="https://img.shields.io/badge/Python-3.12-blue?logo=python&style=for-the-badge" alt="Python">
  <img src="https://img.shields.io/badge/JWT-Authentication-orange?logo=jsonwebtokens&style=for-the-badge" alt="JWT">
  <img src="https://img.shields.io/badge/SQLite-Database-lightblue?logo=sqlite&style=for-the-badge" alt="SQLite">
</p>

<p align="center">
  <b>A comprehensive REST API for personal finance management</b><br>
  Track accounts, transactions, budgets, goals, and get intelligent financial alerts
</p>

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Authentication](#-authentication)
- [Available Endpoints](#-available-endpoints)
- [Seeding Data](#-seeding-data)
- [Development](#-development)
- [Deployment](#-deployment)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **JWT Authentication** | Secure token-based authentication with refresh tokens |
| 💳 **Account Management** | Manage bank accounts, credit cards, wallets, and cash |
| 💰 **Transaction Tracking** | Record income and expenses with category filtering |
| 📊 **Budget Planning** | Set budgets and track spending by category |
| 🎯 **Goal Setting** | Create savings goals with progress tracking |
| 🔔 **Smart Alerts** | Configurable alerts for budgets, bills, and goals |
| 📈 **Financial Summary** | Get income, expense, and net balance summaries |
| 🌱 **Demo Data** | Generate realistic 5-year financial history instantly |

---

## 🛠 Tech Stack

```
Backend Framework:     Django 5.2.8
API Framework:         Django REST Framework 3.15
Authentication:        JWT (djangorestframework-simplejwt)
Database:              SQLite3 (Production: PostgreSQL ready)
Filtering:             django-filter
CORS:                  django-cors-headers
Language:              Python 3.12+
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.12 or higher
- pip (Python package manager)
- Git

### 1. Clone & Navigate

```bash
git clone https://github.com/Harman8815/Wealth-wise.git
cd Wealth-wise/wealthwise_backend
```

### 2. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

**Required packages:**
```
Django>=5.0
djangorestframework>=3.15
djangorestframework-simplejwt>=5.3
django-cors-headers>=4.3
django-filter>=24.0
```

### 4. Run Migrations

```bash
python manage.py migrate
```

### 5. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 6. Start Development Server

```bash
python manage.py runserver
```

✅ **API is now running at:** `http://127.0.0.1:8000/`

---

## 📚 API Documentation

Comprehensive API documentation is available in the [`docs/`](./docs/) directory:

| Document | Description |
|----------|-------------|
| [📖 Main Docs](./docs/README.md) | API overview and quick reference |
| [🔐 Authentication](./docs/authentication.md) | JWT login, tokens, and security |
| [👤 Users](./docs/users.md) | User registration and profile management |
| [💳 Accounts](./docs/accounts.md) | Bank accounts, cards, wallets |
| [💸 Transactions](./docs/transactions.md) | Income & expense tracking |
| [📊 Budget Categories](./docs/budget-categories.md) | Budget planning |
| [🎯 Goals](./docs/goals.md) | Savings goals & progress |
| [🔔 Alerts](./docs/alerts.md) | Notifications & alerts |
| [⚙️ Alert Settings](./docs/alert-settings.md) | Alert configuration |
| [📝 Expenses](./docs/expenses.md) | Quick expense logging |
| [🛠 Utilities](./docs/utilities.md) | Health check & data seeding |

---

## 📁 Project Structure

```
wealthwise_backend/
├── 📂 api/                     # Main application
│   ├── __init__.py
│   ├── admin.py               # Django admin configuration
│   ├── apps.py                # App configuration
│   ├── models.py              # Database models (User, Account, Transaction, etc.)
│   ├── serializers.py         # DRF serializers
│   ├── urls.py                # API endpoint routing
│   ├── views.py               # API viewsets and endpoints
│   └── migrations/            # Database migrations
│
├── 📂 docs/                   # API Documentation
│   ├── README.md              # Documentation index
│   ├── authentication.md      # Auth guide
│   ├── users.md               # Users API
│   ├── accounts.md            # Accounts API
│   ├── transactions.md        # Transactions API
│   ├── budget-categories.md   # Budget API
│   ├── goals.md               # Goals API
│   ├── alerts.md              # Alerts API
│   ├── alert-settings.md      # Alert settings API
│   ├── expenses.md            # Expenses API
│   └── utilities.md           # Utility endpoints
│
├── 📂 wealthwise_backend/     # Project configuration
│   ├── __init__.py
│   ├── settings.py            # Django settings
│   ├── urls.py                # Root URL configuration
│   └── wsgi.py                # WSGI application
│
├── 📄 .gitignore              # Git ignore rules
├── 📄 manage.py               # Django management script
├── 📄 requirements.txt        # Python dependencies
└── 📄 db.sqlite3              # SQLite database (auto-created)
```

---

## 🔐 Authentication

WealthWise uses **JWT (JSON Web Tokens)** for authentication.

### Get Access Token

```bash
POST /api/auth/login/
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "yourpassword"
}
```

**Response:**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Use Token in Requests

```bash
curl -H "Authorization: Bearer <your_access_token>" \
     http://localhost:8000/api/accounts/
```

### Refresh Token

```bash
POST /api/auth/refresh/
{
    "refresh": "<your_refresh_token>"
}
```

📖 **[Full Authentication Guide →](./docs/authentication.md)**

---

## 🌐 Available Endpoints

### 🔓 Public Endpoints (No Auth Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/` | GET | API health check |
| `/api/auth/login/` | POST | Get JWT tokens |
| `/api/auth/refresh/` | POST | Refresh access token |
| `/api/users/` | POST | Register new user |

### 🔒 Protected Endpoints (JWT Required)

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/users/` | GET, PUT, PATCH, DELETE | User management |
| `/api/users/me/` | GET | Get current user |
| `/api/accounts/` | GET, POST, PUT, PATCH, DELETE | Bank accounts & cards |
| `/api/transactions/` | GET, POST, PUT, PATCH, DELETE | Income & expenses |
| `/api/transactions/summary/` | GET | Financial summary |
| `/api/budget-categories/` | GET, POST, PUT, PATCH, DELETE | Budget planning |
| `/api/goals/` | GET, POST, PUT, PATCH, DELETE | Savings goals |
| `/api/alerts/` | GET, POST, PUT, PATCH, DELETE | Notifications |
| `/api/alerts/mark_all_read/` | POST | Mark all alerts as read |
| `/api/alert-settings/` | GET, POST, PUT, PATCH, DELETE | Alert configuration |
| `/api/expenses/` | GET, POST, PUT, PATCH, DELETE | Quick expense tracking |
| `/api/seed-data/` | POST | Generate demo data |

---

## 🌱 Seeding Data

Generate 5 years of realistic financial data instantly:

```bash
POST /api/seed-data/
Authorization: Bearer <token>
{
    "years": 5
}
```

**Creates:**
- ✅ 6 financial accounts (banks, cards, wallets)
- ✅ 8 budget categories with allocations
- ✅ 6 savings goals at various stages
- ✅ 2,000+ transactions over 5 years
- ✅ 700+ expense records
- ✅ 5 alert notifications
- ✅ Alert settings configuration

---

## 🧪 Development

### Run Tests

```bash
python manage.py test
```

### Check for Issues

```bash
python manage.py check
```

### Create Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Shell Access

```bash
python manage.py shell
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Change `SECRET_KEY` in `settings.py`
- [ ] Set `DEBUG = False`
- [ ] Configure allowed hosts: `ALLOWED_HOSTS = ['yourdomain.com']`
- [ ] Switch to PostgreSQL database
- [ ] Set up environment variables
- [ ] Configure CORS for frontend domain
- [ ] Set up HTTPS/SSL
- [ ] Configure JWT token expiration

### Environment Variables

Create a `.env` file:

```env
DEBUG=False
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost/wealthwise
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### Docker Deployment (Optional)

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

CMD ["gunicorn", "wealthwise_backend.wsgi:application", "-b", "0.0.0.0:8000"]
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `python manage.py test`
5. Commit: `git commit -m "Add feature"`
6. Push: `git push origin feature-name`
7. Create a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 🆘 Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/Harman8815/Wealth-wise/issues) page.

**Contact:** support@wealthwise.com

---

<p align="center">
  <b>Built with ❤️ for better financial management</b><br>
  <sub>© 2024 WealthWise. All rights reserved.</sub>
</p>
