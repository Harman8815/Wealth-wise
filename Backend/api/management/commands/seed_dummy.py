"""
Seed command: build a dummy development environment for testing the
Account Management + Multi-Project system.

Resets the development database and creates:
  - 3 users (User 1/2/3) with a known password
  - 2 projects (Personal Finance, Family Budget)
  - Memberships with different roles per project
  - Sample budgets / transactions / goals / alerts for every member

Run with:
    python manage.py seed_dummy
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random

from api.models import (
    User,
    Project,
    ProjectMember,
    ProjectInvitation,
    Account,
    Transaction,
    BudgetCategory,
    Goal,
    Alert,
    AlertSetting,
    Expense,
    Category,
)

DEMO_PASSWORD = "WealthWise123!"

USERS = [
    {"email": "user1@wealthwise.test", "name": "User One"},
    {"email": "user2@wealthwise.test", "name": "User Two"},
    {"email": "user3@wealthwise.test", "name": "User Three"},
]

PROJECTS = [
    {
        "name": "Personal Finance",
        "description": "Your individual money, tracked your way.",
        "currency": "INR",
        "icon": "wallet",
        "color": "#3b82f6",
        "initial_budget": 50000,
        "members": [
            ("user1@wealthwise.test", "owner"),
            ("user2@wealthwise.test", "editor"),
            ("user3@wealthwise.test", "viewer"),
        ],
    },
    {
        "name": "Family Budget",
        "description": "Shared household finances for the whole family.",
        "currency": "INR",
        "icon": "users",
        "color": "#22c55e",
        "initial_budget": 120000,
        "members": [
            ("user2@wealthwise.test", "owner"),
            ("user1@wealthwise.test", "admin"),
            ("user3@wealthwise.test", "editor"),
        ],
    },
]

INCOME_CATEGORIES = [
    {"name": "Salary", "symbol": "briefcase"},
    {"name": "Freelance", "symbol": "briefcase"},
]
EXPENSE_CATEGORIES = [
    {"name": "Food & Dining", "symbol": "utensils", "color": "#ef4444"},
    {"name": "Transportation", "symbol": "car", "color": "#3b82f6"},
    {"name": "Shopping", "symbol": "shopping-cart", "color": "#10b981"},
    {"name": "Entertainment", "symbol": "film", "color": "#8b5cf6"},
    {"name": "Bills & Utilities", "symbol": "zap", "color": "#f59e0b"},
    {"name": "Healthcare", "symbol": "heart-pulse", "color": "#ec4899"},
]


def _reset_database():
    """Clear all application data for a clean slate."""
    ProjectInvitation.objects.all().delete()
    ProjectMember.objects.all().delete()
    Project.objects.all().delete()
    for model in (Transaction, BudgetCategory, Goal, Alert, AlertSetting, Expense, Account, Category):
        model.objects.all().delete()
    User.objects.all().delete()


def _seed_financials(user, offset=0):
    """Create sample accounts, categories, budgets, goals, transactions, alerts for a user."""
    accounts = []
    for acc in [
        {"name": "HDFC Savings", "type": "bank", "balance": 120000 + offset * 1000, "bank_name": "HDFC Bank"},
        {"name": "SBI Salary", "type": "bank", "balance": 80000 + offset * 1000, "bank_name": "SBI"},
        {"name": "Paytm Wallet", "type": "wallet", "balance": 3000, "bank_name": "Paytm"},
    ]:
        accounts.append(Account.objects.create(user=user, **acc))

    cat_lookup = {}
    for c in INCOME_CATEGORIES + EXPENSE_CATEGORIES:
        cat, _ = Category.objects.get_or_create(
            user=user,
            name=c["name"],
            type="income" if c in INCOME_CATEGORIES else "expense",
            defaults={"color": c.get("color", "#64748b"), "icon": c["symbol"], "symbol": c["symbol"]},
        )
        cat_lookup[c["name"]] = cat

    income_cat = cat_lookup["Salary"]
    budget_defs = [
        ("Food & Dining", 18000),
        ("Transportation", 12000),
        ("Shopping", 15000),
        ("Entertainment", 8000),
        ("Bills & Utilities", 14000),
        ("Healthcare", 5000),
    ]
    for name, budgeted in budget_defs:
        BudgetCategory.objects.create(
            user=user,
            category=cat_lookup.get(name),
            name=name,
            budgeted=budgeted,
            spent=0,
            color=cat_lookup[name].color,
            icon=cat_lookup[name].symbol,
        )

    for goal in [
        {"title": "Emergency Fund", "target_amount": 300000, "current_amount": 285000,
         "category": "Emergency", "priority": "high", "status": "active",
         "target_date": timezone.now().date() + timedelta(days=60)},
        {"title": "Vacation Fund", "target_amount": 150000, "current_amount": 90000,
         "category": "Travel", "priority": "medium", "status": "active",
         "target_date": timezone.now().date() + timedelta(days=180)},
    ]:
        Goal.objects.create(user=user, **goal)

    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=90)
    day = start_date
    tx_count = 0
    while day <= end_date:
        if day.day == 25:
            Transaction.objects.create(
                user=user, account=accounts[1], date=day,
                description=f"Salary - {day.strftime('%B %Y')}",
                category=income_cat, amount=85000 + offset * 2000 + random.randint(-3000, 3000),
                type="income", status="completed", account_name=accounts[1].name,
            )
            tx_count += 1
        if random.random() < 0.4:
            name = random.choice(EXPENSE_CATEGORIES)["name"]
            Transaction.objects.create(
                user=user, account=random.choice(accounts), date=day,
                description=f"{name} expense", category=cat_lookup[name],
                amount=random.randint(200, 2500), type="expense", status="completed",
            )
            tx_count += 1
        day += timedelta(days=1)

    for alert in [
        {"type": "warning", "title": "Budget Alert", "message": "You've used 85% of your Food & Dining budget",
         "category": "Budget", "read": False},
        {"type": "success", "title": "Goal Milestone", "message": "You reached 95% of your Emergency Fund",
         "category": "Goals", "read": True},
    ]:
        Alert.objects.create(user=user, **alert)

    return tx_count


class Command(BaseCommand):
    help = "Reset and seed a dummy environment for testing Account Management / Multi-Project."

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Resetting database..."))
        _reset_database()

        self.stdout.write("Creating users...")
        user_map = {}
        for u in USERS:
            user = User.objects.create_user(
                email=u["email"], name=u["name"], password=DEMO_PASSWORD,
                currency="INR", email_verified=True, is_active=True,
            )
            user_map[u["email"]] = user

        total_tx = 0
        self.stdout.write("Creating projects and memberships...")
        unique_members = set()
        for idx, p in enumerate(PROJECTS):
            project = Project.objects.create(
                name=p["name"], description=p["description"], currency=p["currency"],
                icon=p["icon"], color=p["color"], initial_budget=p["initial_budget"],
                created_by=user_map[p["members"][0][0]],
            )
            for email, role in p["members"]:
                ProjectMember.objects.create(
                    project=project, user=user_map[email], role=role,
                    invited_by=user_map[p["members"][0][0]],
                )
                unique_members.add(email)

        # Seed sample financials once per unique user (financial data is user-scoped).
        for offset, email in enumerate(sorted(unique_members)):
            total_tx += _seed_financials(user_map[email], offset=offset)

        self.stdout.write(self.style.SUCCESS(
            f"Done. 3 users, 2 projects, and {total_tx} transactions seeded.\n"
            f"Demo password for all users: {DEMO_PASSWORD}"
        ))
