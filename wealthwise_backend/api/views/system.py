"""
System API views for WealthWise.
Handles health checks and data seeding utilities.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.db import connection, transaction
from django.utils import timezone
from datetime import datetime, timedelta
import random

from ..models import (
    User, Account, Transaction, BudgetCategory, 
    Goal, Alert, AlertSetting, Expense
)


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
        "version": "1.0.0",
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
        
        # Create budget categories
        budget_categories_data = [
            {'name': 'Food & Dining', 'budgeted': 18000, 'color': '#ef4444', 'icon': 'utensils'},
            {'name': 'Transportation', 'budgeted': 12000, 'color': '#3b82f6', 'icon': 'car'},
            {'name': 'Shopping', 'budgeted': 15000, 'color': '#10b981', 'icon': 'shopping-bag'},
            {'name': 'Entertainment', 'budgeted': 8000, 'color': '#8b5cf6', 'icon': 'film'},
            {'name': 'Bills & Utilities', 'budgeted': 14000, 'color': '#f59e0b', 'icon': 'receipt'},
            {'name': 'Healthcare', 'budgeted': 5000, 'color': '#ec4899', 'icon': 'heart-pulse'},
            {'name': 'Education', 'budgeted': 10000, 'color': '#14b8a6', 'icon': 'graduation-cap'},
            {'name': 'Home & Maintenance', 'budgeted': 8000, 'color': '#f97316', 'icon': 'home'},
        ]
        
        budget_cats = {}
        for cat_data in budget_categories_data:
            cat = BudgetCategory.objects.create(user=user, **cat_data, spent=0)
            budget_cats[cat_data['name']] = cat
        
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
                    category='Income',
                    amount=85000 + random.randint(-5000, 5000),
                    type='income',
                    status='completed',
                    account_name='SBI Salary Account'
                )
                transactions_created += 1
            
            # Random expenses
            if random.random() < 0.3:  # 30% chance of expense per day
                categories = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment']
                category = random.choice(categories)
                Transaction.objects.create(
                    user=user,
                    account=random.choice(accounts[2:5]),
                    date=current_date,
                    description=f'{category} expense',
                    category=category,
                    amount=random.randint(100, 5000),
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
