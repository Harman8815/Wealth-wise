from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager
from django.utils import timezone
import uuid


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model for WealthWise"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    currency = models.CharField(max_length=10, default='INR')
    language = models.CharField(max_length=10, default='en')
    theme = models.CharField(max_length=20, default='system')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    objects = UserManager()

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return self.email


class Account(models.Model):
    """Financial accounts (banks, cards, wallets)"""
    ACCOUNT_TYPES = [
        ('bank', 'Bank'),
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('wallet', 'Wallet'),
        ('cash', 'Cash'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=ACCOUNT_TYPES)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default='INR')
    is_active = models.BooleanField(default=True)
    bank_name = models.CharField(max_length=255, blank=True)
    account_number = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts'
        indexes = [
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.name} ({self.user.email})"


class Transaction(models.Model):
    """Financial transaction records (income and expenses)"""
    TRANSACTION_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]

    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('pending', 'Pending'),
    ]

    CATEGORIES = [
        ('Food & Dining', 'Food & Dining'),
        ('Transportation', 'Transportation'),
        ('Shopping', 'Shopping'),
        ('Entertainment', 'Entertainment'),
        ('Bills & Utilities', 'Bills & Utilities'),
        ('Healthcare', 'Healthcare'),
        ('Income', 'Income'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    date = models.DateField()
    description = models.CharField(max_length=500)
    category = models.CharField(max_length=100, choices=CATEGORIES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    account_name = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['date']),
            models.Index(fields=['category']),
            models.Index(fields=['type']),
        ]

    def __str__(self):
        return f"{self.description} - {self.amount}"

    def save(self, *args, **kwargs):
        if self.account and not self.account_name:
            self.account_name = self.account.name
        super().save(*args, **kwargs)


class TransactionHistory(models.Model):
    """Track all changes made to transactions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='history')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transaction_history')
    changed_at = models.DateTimeField(auto_now_add=True)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='changes_made')
    field_name = models.CharField(max_length=50)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)

    class Meta:
        db_table = 'transaction_history'
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['transaction']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"Change to {self.transaction.description} at {self.changed_at}"


class BudgetCategory(models.Model):
    """Budget allocation per category"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budget_categories')
    name = models.CharField(max_length=100)
    budgeted = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    color = models.CharField(max_length=7)
    icon = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'budget_categories'
        unique_together = [['user', 'name']]
        indexes = [
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.name} - {self.user.email}"

    @property
    def remaining(self):
        return self.budgeted - self.spent

    @property
    def percentage_used(self):
        if self.budgeted == 0:
            return 0
        return (self.spent / self.budgeted) * 100


class Goal(models.Model):
    """Financial savings goals and targets"""
    GOAL_CATEGORIES = [
        ('Emergency', 'Emergency'),
        ('Travel', 'Travel'),
        ('Technology', 'Technology'),
        ('Transportation', 'Transportation'),
        ('Education', 'Education'),
        ('Investment', 'Investment'),
        ('Other', 'Other'),
    ]

    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    target_date = models.DateField()
    category = models.CharField(max_length=50, choices=GOAL_CATEGORIES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'goals'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['status']),
            models.Index(fields=['target_date']),
        ]

    def __str__(self):
        return f"{self.title} - {self.user.email}"

    @property
    def percentage_complete(self):
        if self.target_amount == 0:
            return 0
        return (self.current_amount / self.target_amount) * 100

    def save(self, *args, **kwargs):
        if self.current_amount >= self.target_amount and self.status != 'completed':
            self.status = 'completed'
            self.completed_at = timezone.now()
        super().save(*args, **kwargs)


class Alert(models.Model):
    """User notifications and system alerts"""
    ALERT_TYPES = [
        ('warning', 'Warning'),
        ('info', 'Info'),
        ('success', 'Success'),
        ('error', 'Error'),
    ]

    ALERT_CATEGORIES = [
        ('Budget', 'Budget'),
        ('Bills', 'Bills'),
        ('Goals', 'Goals'),
        ('Security', 'Security'),
        ('Account', 'Account'),
        ('Investments', 'Investments'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alerts')
    type = models.CharField(max_length=20, choices=ALERT_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    category = models.CharField(max_length=50, choices=ALERT_CATEGORIES)
    timestamp = models.DateTimeField(default=timezone.now)
    read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    action_url = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'alerts'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['read']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"{self.title} - {self.user.email}"

    def mark_as_read(self):
        if not self.read:
            self.read = True
            self.read_at = timezone.now()
            self.save(update_fields=['read', 'read_at'])


class AlertSetting(models.Model):
    """User alert preferences"""
    ALERT_CATEGORIES = [
        ('Budget', 'Budget'),
        ('Bills', 'Bills'),
        ('Goals', 'Goals'),
        ('Security', 'Security'),
        ('Account', 'Account'),
        ('Investments', 'Investments'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alert_settings')
    setting_id = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=ALERT_CATEGORIES)
    enabled = models.BooleanField(default=True)
    threshold = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    threshold_unit = models.CharField(max_length=10, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'alert_settings'
        unique_together = [['user', 'setting_id']]
        indexes = [
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.title} - {self.user.email}"


class Expense(models.Model):
    """Quick expense tracking for daily expenses"""
    CATEGORIES = [
        ('Food & Dining', 'Food & Dining'),
        ('Transportation', 'Transportation'),
        ('Shopping', 'Shopping'),
        ('Entertainment', 'Entertainment'),
        ('Bills', 'Bills'),
        ('Healthcare', 'Healthcare'),
        ('Other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    date = models.DateField()
    category = models.CharField(max_length=100, choices=CATEGORIES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.CharField(max_length=500)
    receipt_url = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expenses'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"{self.note} - {self.amount}"
