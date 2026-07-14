"""
System API views for WealthWise.
Handles health checks and data seeding utilities.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.db import connection, transaction
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta
import random

from ..models import (
    User, Account, Transaction, BudgetCategory, 
    Goal, Alert, AlertSetting, Expense, Category
)
from ..base import NotFoundException, PermissionDenied

DEFAULT_DEMO_USER_EMAIL = "demo@wealthwise.com"
DEFAULT_DEMO_USER_PASSWORD = "WealthWise123!"


def get_or_create_default_user():
    user, created = User.objects.get_or_create(
        email=DEFAULT_DEMO_USER_EMAIL,
        defaults={
            "name": "Demo User",
            "currency": "INR",
            "language": "en",
            "theme": "system",
            "is_active": True,
            "email_verified": True,
        },
    )
    if created or not user.check_password(DEFAULT_DEMO_USER_PASSWORD):
        user.set_password(DEFAULT_DEMO_USER_PASSWORD)
        user.is_active = True
        user.email_verified = True
        user.save(update_fields=["password", "is_active", "email_verified"])
    return user, created


@api_view(['GET'])
@permission_classes([AllowAny])
def default_user_info(request):
    """Ensure a demo user exists and return the default login credentials."""
    _, created = get_or_create_default_user()
    return Response({
        "email": DEFAULT_DEMO_USER_EMAIL,
        "password": DEFAULT_DEMO_USER_PASSWORD,
        "created": created,
        "message": "Default demo user is ready.",
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def quick_login(request):
    """Development-only credential-less login for a seeded dummy user.

    Body: { "email": "user1@wealthwise.test" }
    Returns JWT access/refresh tokens. Disabled unless settings.DEBUG is True.
    """
    if not settings.DEBUG:
        raise PermissionDenied("Quick login is only available in development.")

    email = (request.data or {}).get("email")
    if not email:
        raise NotFoundException("email is required.")

    user = User.objects.filter(email__iexact=email).first()
    if not user:
        raise NotFoundException("No user with that email. Run `python manage.py seed_dummy` first.")

    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    return Response({"access": str(refresh.access_token), "refresh": str(refresh)})



@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint to verify API status.
    
    Returns:
        status: 'healthy' or 'degraded'
        timestamp: Current server timestamp
        database: Database connection status
        version: API version
        services: Status of dependent services
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return Response({
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": timezone.now().isoformat(),
        "database": db_status,
        "version": "2.0.0",
        "services": {
            "api": "up",
            "database": db_status
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def seed_historical_data(request):
    """
    Seed complex, varied historical data for financial testing.
    
    Creates realistic financial patterns with seasonal variations
    and life events for the specified number of years.
    
    Request body:
        years: Number of years to generate (default: 5)
        
    Returns:
        Summary of created data including counts and date range.
    """
    user = request.user
    years = request.data.get('years', 5)
    
    with transaction.atomic():
        # Clear existing user data
        Transaction.objects.filter(user=user).delete()
        Expense.objects.filter(user=user).delete()
        Goal.objects.filter(user=user).delete()
        Alert.objects.filter(user=user).delete()
        BudgetCategory.objects.filter(user=user).delete()
        Account.objects.filter(user=user).delete()
        
        # Create accounts
        accounts_data = [
            {'name': 'HDFC Savings', 'type': 'bank', 'balance': 125000, 'bank_name': 'HDFC Bank'},
            {'name': 'SBI Salary Account', 'type': 'bank', 'balance': 85000, 'bank_name': 'State Bank of India'},
            {'name': 'ICICI Credit Card', 'type': 'credit_card', 'balance': -15670, 'bank_name': 'ICICI Bank'},
            {'name': 'HDFC Debit Card', 'type': 'debit_card', 'balance': 12000, 'bank_name': 'HDFC Bank'},
            {'name': 'Paytm Wallet', 'type': 'wallet', 'balance': 3500, 'bank_name': 'Paytm'},
            {'name': 'Cash in Hand', 'type': 'cash', 'balance': 2500, 'bank_name': 'Self'},
        ]
        
        accounts = []
        for acc_data in accounts_data:
            account = Account.objects.create(user=user, **acc_data)
            accounts.append(account)
        
        # Categories for transactions
        categories_data = [
            {'name': 'Income', 'type': 'income', 'color': '#22c55e', 'icon': 'briefcase', 'symbol': 'briefcase'},
            {'name': 'Food & Dining', 'type': 'expense', 'color': '#ef4444', 'icon': 'utensils', 'symbol': 'utensils'},
            {'name': 'Transportation', 'type': 'expense', 'color': '#3b82f6', 'icon': 'car', 'symbol': 'car'},
            {'name': 'Shopping', 'type': 'expense', 'color': '#10b981', 'icon': 'shopping-cart', 'symbol': 'shopping-cart'},
            {'name': 'Entertainment', 'type': 'expense', 'color': '#8b5cf6', 'icon': 'film', 'symbol': 'film'},
            {'name': 'Bills & Utilities', 'type': 'expense', 'color': '#f59e0b', 'icon': 'zap', 'symbol': 'zap'},
            {'name': 'Healthcare', 'type': 'expense', 'color': '#ec4899', 'icon': 'heart-pulse', 'symbol': 'heart-pulse'},
        ]

        category_lookup = {}
        for cat_data in categories_data:
            cat, _ = Category.objects.get_or_create(
                user=user,
                name=cat_data['name'],
                type=cat_data['type'],
                defaults={
                    'color': cat_data['color'],
                    'text_color': '#ffffff',
                    'icon': cat_data['icon'],
                    'symbol': cat_data['symbol'],
                    'is_default': True,
                }
            )
            category_lookup[cat_data['name']] = cat

        income_category = category_lookup['Income']
        expense_categories = [category_lookup['Food & Dining'], category_lookup['Transportation'], category_lookup['Shopping'], category_lookup['Entertainment'], category_lookup['Bills & Utilities'], category_lookup['Healthcare']]

        # Create budget categories and link to transaction categories
        budget_categories_data = [
            {'name': 'Food & Dining', 'budgeted': 18000, 'color': '#ef4444', 'icon': 'utensils', 'monthly_spend': 1500},
            {'name': 'Transportation', 'budgeted': 12000, 'color': '#3b82f6', 'icon': 'car', 'monthly_spend': 1000},
            {'name': 'Shopping', 'budgeted': 15000, 'color': '#10b981', 'icon': 'shopping-cart', 'monthly_spend': 1250},
            {'name': 'Entertainment', 'budgeted': 8000, 'color': '#8b5cf6', 'icon': 'film', 'monthly_spend': 700},
            {'name': 'Bills & Utilities', 'budgeted': 14000, 'color': '#f59e0b', 'icon': 'zap', 'monthly_spend': 1200},
            {'name': 'Healthcare', 'budgeted': 5000, 'color': '#ec4899', 'icon': 'heart-pulse', 'monthly_spend': 400},
            {'name': 'Education', 'budgeted': 10000, 'color': '#14b8a6', 'icon': 'book', 'monthly_spend': 800},
            {'name': 'Home & Maintenance', 'budgeted': 8000, 'color': '#f97316', 'icon': 'home', 'monthly_spend': 700},
        ]
        
        budget_cats = {}
        for cat_data in budget_categories_data:
            cat = BudgetCategory.objects.create(
                user=user,
                category=category_lookup.get(cat_data['name']),
                name=cat_data['name'],
                budgeted=cat_data['budgeted'],
                spent=0,
                color=cat_data['color'],
                icon=cat_data['icon'],
            )
            budget_cats[cat_data['name']] = cat

        category_spend_profile = {
            'Food & Dining': {'min': 300, 'max': 800, 'monthly': 1500, 'weight': 4},
            'Transportation': {'min': 200, 'max': 600, 'monthly': 1000, 'weight': 3},
            'Shopping': {'min': 500, 'max': 3000, 'monthly': 1250, 'weight': 2},
            'Entertainment': {'min': 200, 'max': 1500, 'monthly': 700, 'weight': 2},
            'Bills & Utilities': {'min': 800, 'max': 2000, 'monthly': 1200, 'weight': 1},
            'Healthcare': {'min': 500, 'max': 3000, 'monthly': 400, 'weight': 1},
            'Education': {'min': 1000, 'max': 5000, 'monthly': 800, 'weight': 1},
            'Home & Maintenance': {'min': 500, 'max': 2000, 'monthly': 700, 'weight': 1},
        }

        expense_category_lookup = {
            'Food & Dining': category_lookup.get('Food & Dining'),
            'Transportation': category_lookup.get('Transportation'),
            'Shopping': category_lookup.get('Shopping'),
            'Entertainment': category_lookup.get('Entertainment'),
            'Bills & Utilities': category_lookup.get('Bills & Utilities'),
            'Healthcare': category_lookup.get('Healthcare'),
        }
        
        # Create goals
        goals_data = [
            {
                'title': 'Emergency Fund',
                'description': 'Build 6 months of expenses as emergency fund',
                'target_amount': 300000,
                'current_amount': 285000,
                'category': 'Emergency',
                'priority': 'high',
                'status': 'active',
                'target_date': timezone.now().date() + timedelta(days=60),
            },
            {
                'title': 'Europe Vacation 2024',
                'description': 'Save for a 2-week European vacation',
                'target_amount': 250000,
                'current_amount': 195000,
                'category': 'Travel',
                'priority': 'medium',
                'status': 'active',
                'target_date': timezone.now().date() + timedelta(days=180),
            },
            {
                'title': 'New Car Down Payment',
                'description': 'Save for down payment on Hyundai Creta',
                'target_amount': 500000,
                'current_amount': 320000,
                'category': 'Transportation',
                'priority': 'high',
                'status': 'active',
                'target_date': timezone.now().date() + timedelta(days=450),
            },
        ]
        
        for goal_data in goals_data:
            Goal.objects.create(user=user, **goal_data)
        
        # Generate transactions (simplified)
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=365 * years)
        transactions_created = 0
        
        current_date = start_date
        while current_date <= end_date:
            # Monthly salary
            if current_date.day == 25:
                Transaction.objects.create(
                    user=user,
                    account=accounts[1],
                    date=current_date,
                    description=f"Salary - {current_date.strftime('%B %Y')}",
                    category=income_category,
                    amount=85000 + random.randint(-5000, 5000),
                    type='income',
                    status='completed',
                    account_name='SBI Salary Account'
                )
                transactions_created += 1
            
            # Random expenses correlated with budget categories
            if random.random() < 0.35:  # ~35% chance of expense per day
                category_names = list(category_spend_profile.keys())
                weights = [category_spend_profile[name]['weight'] for name in category_names]
                selected_name = random.choices(category_names, weights=weights, k=1)[0]
                profile = category_spend_profile[selected_name]
                amount = random.randint(profile['min'], profile['max'])
                
                Transaction.objects.create(
                    user=user,
                    account=random.choice(accounts[2:5]),
                    date=current_date,
                    description=f'{selected_name} expense',
                    category=expense_category_lookup.get(selected_name),
                    amount=amount,
                    type='expense',
                    status='completed',
                )
                transactions_created += 1
            
            current_date += timedelta(days=1)
        
        # Create sample alerts
        alerts_data = [
            {'type': 'warning', 'title': 'Budget Alert', 'message': 'You have spent 85% of your Food & Dining budget', 'category': 'Budget', 'read': False},
            {'type': 'info', 'title': 'Bill Reminder', 'message': 'Your electricity bill is due in 3 days', 'category': 'Bills', 'read': False},
            {'type': 'success', 'title': 'Goal Milestone', 'message': 'Congratulations! You reached 95% of your Emergency Fund goal', 'category': 'Goals', 'read': True},
        ]
        
        for alert_data in alerts_data:
            Alert.objects.create(user=user, **alert_data)
    
    return Response({
        'status': 'success',
        'message': f'Successfully seeded {years} years of data',
        'data': {
            'accounts_created': len(accounts_data),
            'budget_categories_created': len(budget_categories_data),
            'goals_created': len(goals_data),
            'transactions_created': transactions_created,
            'alerts_created': len(alerts_data),
        }
    })
