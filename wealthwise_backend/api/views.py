from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import User, Account, Transaction, BudgetCategory, Goal, Alert, AlertSetting, Expense
from .serializers import (
    UserSerializer, UserCreateSerializer, AccountSerializer,
    TransactionSerializer, BudgetCategorySerializer, GoalSerializer,
    AlertSerializer, AlertSettingSerializer, ExpenseSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'type', 'status', 'date']

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-date', '-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        transactions = self.get_queryset()
        income = sum(t.amount for t in transactions if t.type == 'income')
        expense = sum(t.amount for t in transactions if t.type == 'expense')
        return Response({'income': income, 'expense': expense, 'net': income - expense})


class BudgetCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BudgetCategory.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'priority', 'status']

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AlertViewSet(viewsets.ModelViewSet):
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type', 'category', 'read']

    def get_queryset(self):
        return Alert.objects.filter(user=self.request.user).order_by('-timestamp')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        alert = self.get_object()
        alert.mark_as_read()
        return Response({'status': 'alert marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Alert.objects.filter(user=request.user, read=False).update(read=True, read_at=timezone.now())
        return Response({'status': 'all alerts marked as read'})


class AlertSettingViewSet(viewsets.ModelViewSet):
    serializer_class = AlertSettingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'enabled']

    def get_queryset(self):
        return AlertSetting.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'date']

    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.db import transaction
import random
from datetime import datetime, timedelta
import decimal


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint to verify API status"""
    from django.db import connection
    
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
    Seed complex, varied historical data for the last 5 years.
    Creates realistic financial patterns with seasonal variations and life events.
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
        
        # Create accounts with varied balances
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
        
        # Create budget categories with realistic allocations
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
        
        # Create realistic goals at different stages
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
                'created_at': timezone.now() - timedelta(days=730)
            },
            {
                'title': 'Europe Vacation 2024',
                'description': 'Save for a 2-week European vacation - Paris, Rome, Barcelona',
                'target_amount': 250000,
                'current_amount': 195000,
                'category': 'Travel',
                'priority': 'medium',
                'status': 'active',
                'target_date': timezone.now().date() + timedelta(days=180),
                'created_at': timezone.now() - timedelta(days=365)
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
                'created_at': timezone.now() - timedelta(days=180)
            },
            {
                'title': 'MacBook Pro M3',
                'description': 'New laptop for work and personal use',
                'target_amount': 185000,
                'current_amount': 185000,
                'category': 'Technology',
                'priority': 'low',
                'status': 'completed',
                'target_date': timezone.now().date() - timedelta(days=45),
                'created_at': timezone.now() - timedelta(days=400)
            },
            {
                'title': 'Child Education Fund',
                'description': 'Long-term savings for child higher education',
                'target_amount': 1500000,
                'current_amount': 425000,
                'category': 'Education',
                'priority': 'high',
                'status': 'active',
                'target_date': timezone.now().date() + timedelta(days=1825),
                'created_at': timezone.now() - timedelta(days=1095)
            },
            {
                'title': 'Home Renovation',
                'description': 'Kitchen and bathroom renovation project',
                'target_amount': 400000,
                'current_amount': 85000,
                'category': 'Other',
                'priority': 'medium',
                'status': 'paused',
                'target_date': timezone.now().date() + timedelta(days=730),
                'created_at': timezone.now() - timedelta(days=90)
            },
        ]
        
        for goal_data in goals_data:
            completed_at = None
            if goal_data['status'] == 'completed':
                completed_at = goal_data['target_date'] - timedelta(days=30)
            Goal.objects.create(
                user=user,
                title=goal_data['title'],
                description=goal_data['description'],
                target_amount=goal_data['target_amount'],
                current_amount=goal_data['current_amount'],
                target_date=goal_data['target_date'],
                category=goal_data['category'],
                priority=goal_data['priority'],
                status=goal_data['status'],
                created_at=goal_data['created_at'],
                completed_at=completed_at
            )
        
        # Generate 5 years of transactions with realistic patterns
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=365 * years)
        
        # Income sources with variations
        income_sources = [
            {'description': 'Monthly Salary Credit', 'base_amount': 85000, 'variance': 5000, 'category': 'Income', 'account': 1},
            {'description': 'Freelance Project Payment', 'base_amount': 25000, 'variance': 15000, 'category': 'Income', 'account': 0},
            {'description': 'Stock Dividend', 'base_amount': 3500, 'variance': 2000, 'category': 'Income', 'account': 0},
            {'description': 'Rental Income', 'base_amount': 18000, 'variance': 0, 'category': 'Income', 'account': 0},
            {'description': 'Performance Bonus', 'base_amount': 50000, 'variance': 25000, 'category': 'Income', 'account': 1},
        ]
        
        # Expense merchants and patterns
        expense_merchants = {
            'Food & Dining': [
                ('Big Bazaar Grocery', 2500, 1500), ('Swiggy/Zomato Orders', 800, 400),
                ('Restaurant - Barbeque Nation', 2500, 1000), ('Starbucks Coffee', 350, 200),
                ('Local Kirana Store', 800, 300), ('Dominos Pizza', 600, 200),
                ('Office Cafeteria', 150, 50), ('Family Dinner Outing', 3000, 1500),
            ],
            'Transportation': [
                ('Uber/Ola Ride', 400, 200), ('Petrol Pump - Shell', 2500, 800),
                ('Car Service & Maintenance', 3500, 1500), ('Metro Card Recharge', 500, 200),
                ('Uber Intercity', 1500, 500), ('Parking Fees', 200, 100),
            ],
            'Shopping': [
                ('Amazon India', 3000, 2000), ('Myntra Fashion', 2500, 1500),
                ('Flipkart Electronics', 8000, 3000), ('Reliance Trends', 2000, 1000),
                ('DMart Shopping', 4500, 2000), ('iPhone Accessories', 2500, 1000),
            ],
            'Entertainment': [
                ('Netflix Subscription', 649, 0), ('Amazon Prime', 1499, 0),
                ('Movie Tickets - PVR', 800, 400), ('Spotify Premium', 199, 0),
                ('Gaming - Steam', 2000, 1500), ('Concert Tickets', 5000, 3000),
            ],
            'Bills & Utilities': [
                ('Electricity Bill - BESCOM', 2200, 800), ('Internet - ACT Fibernet', 1250, 0),
                ('Mobile Postpaid - Airtel', 999, 200), ('Water Bill', 450, 100),
                ('Gas Cylinder - Indane', 1100, 50), ('Society Maintenance', 3500, 0),
            ],
            'Healthcare': [
                ('Apollo Pharmacy', 800, 400), ('Consultation - Dr. Sharma', 800, 0),
                ('Annual Health Checkup', 4500, 0), ('Dental Treatment', 5000, 3000),
                ('Health Insurance Premium', 12000, 0), ('Eye Checkup & Glasses', 8000, 4000),
            ],
            'Education': [
                ('Udemy Courses', 1500, 1000), ('Coursera Subscription', 4500, 0),
                ('Child School Fees', 15000, 0), ('Books - Amazon', 1200, 800),
                ('Workshop & Seminar', 5000, 3000),
            ],
            'Home & Maintenance': [
                ('Urban Company - Cleaning', 800, 300), ('Plumber Service', 500, 200),
                ('AC Service', 1500, 500), ('Furniture - Pepperfry', 15000, 10000),
                ('Home Decor', 5000, 3000),
            ],
        }
        
        transactions_created = 0
        expenses_created = 0
        
        current_date = start_date
        while current_date <= end_date:
            # Monthly salary (25th of each month)
            salary_date = current_date.replace(day=min(25, (current_date + timedelta(days=32)).day))
            if current_date.day <= 25:
                salary_variance = random.randint(-5000, 8000)
                bonus_months = [3, 6, 12]  # March, June, December
                base_salary = 85000
                
                if current_date.month in bonus_months:
                    base_salary += random.choice([0, 25000, 50000])  # Occasional bonuses
                
                Transaction.objects.create(
                    user=user,
                    account=accounts[1],
                    date=salary_date,
                    description=f"Salary Credit - {current_date.strftime('%B %Y')}",
                    category='Income',
                    amount=base_salary + salary_variance,
                    type='income',
                    status='completed',
                    account_name='SBI Salary Account'
                )
                transactions_created += 1
            
            # Random income events (quarterly)
            if current_date.day == 15 and current_date.month in [1, 4, 7, 10]:
                freelance = random.choice(income_sources[1:4])
                variance = random.randint(-freelance['variance'], freelance['variance'])
                Transaction.objects.create(
                    user=user,
                    account=accounts[0],
                    date=current_date,
                    description=freelance['description'],
                    category='Income',
                    amount=freelance['base_amount'] + variance,
                    type='income',
                    status='completed',
                    account_name='HDFC Savings'
                )
                transactions_created += 1
            
            # Daily expenses (weekdays more frequent)
            num_expenses = random.randint(0, 3) if current_date.weekday() < 5 else random.randint(0, 6)
            
            for _ in range(num_expenses):
                category = random.choice(list(expense_merchants.keys()))
                merchant = random.choice(expense_merchants[category])
                
                amount_variance = random.randint(-merchant[2], merchant[2]) if merchant[2] > 0 else 0
                amount = merchant[1] + amount_variance
                
                account = random.choice(accounts[2:5])  # Credit, debit, or wallet
                
                Transaction.objects.create(
                    user=user,
                    account=account,
                    date=current_date,
                    description=merchant[0],
                    category=category,
                    amount=amount,
                    type='expense',
                    status='completed',
                    account_name=account.name
                )
                
                # Also create expense record for tracking
                if random.random() < 0.3:  # 30% of transactions become expenses
                    Expense.objects.create(
                        user=user,
                        date=current_date,
                        category=category,
                        amount=amount,
                        note=merchant[0]
                    )
                    expenses_created += 1
                
                transactions_created += 1
            
            # Monthly recurring bills (1st-5th of month)
            if current_date.day in [1, 2, 3, 4, 5]:
                bills = [
                    ('Electricity Bill - BESCOM', 2200 + random.randint(-800, 1200), 'Bills & Utilities'),
                    ('Internet - ACT Fibernet', 1250, 'Bills & Utilities'),
                    ('Mobile Postpaid', 999 + random.randint(-200, 400), 'Bills & Utilities'),
                ]
                bill = random.choice(bills)
                Transaction.objects.create(
                    user=user,
                    account=accounts[2],
                    date=current_date,
                    description=bill[0],
                    category=bill[2],
                    amount=bill[1],
                    type='expense',
                    status='completed',
                    account_name='ICICI Credit Card'
                )
                transactions_created += 1
            
            # Seasonal variations
            if current_date.month in [10, 11]:  # Festival season
                festival_expenses = [
                    ('Diwali Shopping - Clothes', 15000, 'Shopping'),
                    ('Diwali Gifts', 8000, 'Shopping'),
                    ('Festival Decorations', 3000, 'Home & Maintenance'),
                    ('Special Family Dinner', 5000, 'Food & Dining'),
                ]
                if current_date.day == random.randint(1, 30):
                    exp = random.choice(festival_expenses)
                    Transaction.objects.create(
                        user=user,
                        account=accounts[2],
                        date=current_date,
                        description=exp[0],
                        category=exp[2],
                        amount=exp[1] + random.randint(-2000, 3000),
                        type='expense',
                        status='completed',
                        account_name='ICICI Credit Card'
                    )
                    transactions_created += 1
            
            # Vacation months (summer holidays)
            if current_date.month in [5, 6]:
                vacation_expenses = [
                    ('Flight Tickets - Goa', 25000, 'Travel'),
                    ('Hotel Booking - Resort', 18000, 'Travel'),
                    ('Car Rental', 8000, 'Transportation'),
                ]
                if random.random() < 0.1:  # 10% chance
                    exp = random.choice(vacation_expenses)
                    Transaction.objects.create(
                        user=user,
                        account=accounts[1],
                        date=current_date,
                        description=exp[0],
                        category=exp[2],
                        amount=exp[1],
                        type='expense',
                        status='completed',
                        account_name='SBI Salary Account'
                    )
                    transactions_created += 1
            
            # Large purchases (random throughout years)
            if random.random() < 0.005:  # Rare large purchases
                large_purchases = [
                    ('iPhone 15 Pro', 135000, 'Shopping'),
                    ('Samsung Refrigerator', 45000, 'Home & Maintenance'),
                    ('LG Washing Machine', 35000, 'Home & Maintenance'),
                    ('Sony PS5 Console', 55000, 'Entertainment'),
                ]
                purchase = random.choice(large_purchases)
                Transaction.objects.create(
                    user=user,
                    account=accounts[1] if purchase[1] > 50000 else accounts[2],
                    date=current_date,
                    description=purchase[0],
                    category=purchase[2],
                    amount=purchase[1],
                    type='expense',
                    status='completed',
                    account_name='SBI Salary Account' if purchase[1] > 50000 else 'ICICI Credit Card'
                )
                transactions_created += 1
            
            current_date += timedelta(days=1)
        
        # Update budget spent amounts based on transactions
        for cat_name, budget_cat in budget_cats.items():
            total_spent = Transaction.objects.filter(
                user=user, 
                category=cat_name, 
                type='expense'
            ).aggregate(total=models.Sum('amount'))['total'] or 0
            budget_cat.spent = total_spent
            budget_cat.save()
        
        # Create alerts based on financial activity
        alerts_data = [
            {'type': 'warning', 'title': 'Budget Alert', 'message': 'You have spent 85% of your Food & Dining budget', 'category': 'Budget', 'read': False},
            {'type': 'info', 'title': 'Bill Reminder', 'message': 'Your electricity bill of ₹2,450 is due in 3 days', 'category': 'Bills', 'read': False},
            {'type': 'success', 'title': 'Goal Milestone', 'message': 'Congratulations! You have reached 95% of your Emergency Fund goal', 'category': 'Goals', 'read': True},
            {'type': 'error', 'title': 'Unusual Spending', 'message': 'Large transaction of ₹135,000 detected. Please verify if this was authorized', 'category': 'Security', 'read': False},
            {'type': 'info', 'title': 'Monthly Report', 'message': 'Your financial report for last month is ready', 'category': 'Account', 'read': True},
        ]
        
        for alert_data in alerts_data:
            read_at = timezone.now() - timedelta(days=random.randint(1, 5)) if alert_data['read'] else None
            Alert.objects.create(
                user=user,
                type=alert_data['type'],
                title=alert_data['title'],
                message=alert_data['message'],
                category=alert_data['category'],
                read=alert_data['read'],
                read_at=read_at,
                timestamp=timezone.now() - timedelta(days=random.randint(0, 7))
            )
        
        # Create default alert settings
        default_settings = [
            {'setting_id': 'budget_warning', 'title': 'Budget Warnings', 'description': 'Get notified when approaching budget limits', 'category': 'Budget', 'enabled': True, 'threshold': 80, 'threshold_unit': '%'},
            {'setting_id': 'bill_reminders', 'title': 'Bill Reminders', 'description': 'Receive reminders for upcoming bills', 'category': 'Bills', 'enabled': True},
            {'setting_id': 'goal_milestones', 'title': 'Goal Milestones', 'description': 'Celebrate savings achievements', 'category': 'Goals', 'enabled': True},
            {'setting_id': 'unusual_spending', 'title': 'Unusual Spending Alert', 'description': 'Alert for out-of-pattern transactions', 'category': 'Security', 'enabled': True, 'threshold': 15000, 'threshold_unit': '₹'},
            {'setting_id': 'low_balance', 'title': 'Low Balance Alert', 'description': 'Warning when account falls below threshold', 'category': 'Account', 'enabled': False, 'threshold': 5000, 'threshold_unit': '₹'},
        ]
        
        for setting in default_settings:
            AlertSetting.objects.create(user=user, **setting)
    
    return Response({
        'status': 'success',
        'message': f'Successfully seeded {years} years of historical data',
        'data': {
            'accounts_created': len(accounts_data),
            'budget_categories_created': len(budget_categories_data),
            'goals_created': len(goals_data),
            'transactions_created': transactions_created,
            'expenses_created': expenses_created,
            'alerts_created': len(alerts_data),
            'period_covered': f'{start_date} to {end_date}'
        }
    })
