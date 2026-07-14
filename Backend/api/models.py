from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager
from django.utils import timezone
import uuid
import io


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

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    date = models.DateField()
    description = models.CharField(max_length=500)
    category = models.ForeignKey('Category', on_delete=models.PROTECT, null=True, blank=True, related_name='transactions')
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
    ICON_SYMBOLS = [
        ('utensils', 'Utensils'),
        ('car', 'Car'),
        ('shopping-cart', 'Shopping Cart'),
        ('film', 'Film'),
        ('home', 'Home'),
        ('heart-pulse', 'Healthcare'),
        ('fuel', 'Fuel'),
        ('wifi', 'Internet'),
        ('phone', 'Phone'),
        ('credit-card', 'Credit Card'),
        ('gift', 'Gift'),
        ('coffee', 'Coffee'),
        ('book', 'Education'),
        ('plane', 'Travel'),
        ('dumbbell', 'Fitness'),
        ('music', 'Music'),
        ('shirt', 'Shopping'),
        ('zap', 'Utilities'),
        ('piggy-bank', 'Savings'),
        ('briefcase', 'Work'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budget_categories')
    name = models.CharField(max_length=100)
    category = models.ForeignKey('Category', on_delete=models.PROTECT, null=True, blank=True, related_name='budget_allocations')
    budgeted = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    color = models.CharField(max_length=7, default='#3b82f6')
    text_color = models.CharField(max_length=7, default='#ffffff')
    icon = models.CharField(max_length=50, blank=True, default='utensils')
    symbol = models.CharField(max_length=50, blank=True, default='utensils', choices=ICON_SYMBOLS)
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


class Category(models.Model):
    """Shared category system across the application."""
    CATEGORY_TYPES = [
        ('expense', 'Expense'),
        ('income', 'Income'),
        ('goal', 'Goal'),
        ('budget', 'Budget'),
    ]

    ICON_SYMBOLS = [
        ('utensils', 'Utensils'),
        ('car', 'Car'),
        ('shopping-cart', 'Shopping Cart'),
        ('film', 'Film'),
        ('home', 'Home'),
        ('heart-pulse', 'Healthcare'),
        ('fuel', 'Fuel'),
        ('wifi', 'Internet'),
        ('phone', 'Phone'),
        ('credit-card', 'Credit Card'),
        ('gift', 'Gift'),
        ('coffee', 'Coffee'),
        ('book', 'Education'),
        ('plane', 'Travel'),
        ('dumbbell', 'Fitness'),
        ('music', 'Music'),
        ('shirt', 'Shopping'),
        ('zap', 'Utilities'),
        ('piggy-bank', 'Savings'),
        ('briefcase', 'Work'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=CATEGORY_TYPES, default='expense')
    color = models.CharField(max_length=7, default='#3b82f6')
    text_color = models.CharField(max_length=7, default='#ffffff')
    icon = models.CharField(max_length=50, blank=True, default='utensils')
    symbol = models.CharField(max_length=50, blank=True, default='utensils', choices=ICON_SYMBOLS)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'categories'
        unique_together = [['user', 'name', 'type']]
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['type']),
        ]

    def __str__(self):
        return f"{self.name} - {self.user.email}"


class Expense(models.Model):
    """Quick expense tracking for daily expenses"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    date = models.DateField()
    category = models.ForeignKey('Category', on_delete=models.PROTECT, related_name='expenses')
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


class ScheduledReport(models.Model):
    REPORT_TYPES = [
        ('budget_summary', 'Budget Summary'),
        ('monthly_report', 'Monthly Report'),
        ('category_analysis', 'Category Analysis'),
        ('spending_trends', 'Spending Trends'),
        ('complete', 'Complete Financial Report'),
    ]

    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scheduled_reports')
    name = models.CharField(max_length=255)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    enabled = models.BooleanField(default=True)
    last_run = models.DateTimeField(null=True, blank=True)
    next_run = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'scheduled_reports'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['enabled']),
            models.Index(fields=['next_run']),
        ]

    def __str__(self):
        return f"{self.name} - {self.user.email}"


class Project(models.Model):
    """A collaborative finance workspace. Every financial entity belongs to a project.

    A project represents an independent finance workspace (e.g. personal, household,
    a club, or a small business). Users join projects through ProjectMember records
    and each membership has its own role (RBAC is project-scoped, not user-scoped).
    """

    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('editor', 'Editor'),
        ('viewer', 'Viewer'),
    ]

    ICON_CHOICES = [
        ('wallet', 'Wallet'),
        ('briefcase', 'Work'),
        ('home', 'Home'),
        ('users', 'Team'),
        ('piggy-bank', 'Savings'),
        ('plane', 'Travel'),
        ('heart', 'Health'),
        ('graduation-cap', 'Education'),
        ('shopping-cart', 'Shopping'),
        ('chart-line', 'Investments'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    currency = models.CharField(max_length=10, default='INR')
    icon = models.CharField(max_length=50, blank=True, default='wallet')
    color = models.CharField(max_length=7, default='#3b82f6')
    initial_budget = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        indexes = [
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    """Membership linking a User to a Project with a project-scoped role."""

    ROLE_CHOICES = Project.ROLE_CHOICES

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    invited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='invited_members')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_members'
        unique_together = [['project', 'user']]
        indexes = [
            models.Index(fields=['project']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.user.email} @ {self.project.name} ({self.role})"


class ProjectInvitation(models.Model):
    """Email invitation to join a project. Converted to a ProjectMember on accept."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
    ]

    ROLE_CHOICES = Project.ROLE_CHOICES

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='editor')
    invited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_invitations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    token = models.CharField(max_length=64, unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'project_invitations'
        unique_together = [['project', 'email']]
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['email', 'status']),
        ]

    def __str__(self):
        return f"Invite {self.email} -> {self.project.name} ({self.status})"

    @property
    def is_expired(self):
        if not self.expires_at:
            return False
        return timezone.now() > self.expires_at


def create_schedule(user, name, report_type, frequency, next_run=None):
    """Create a new scheduled report configuration."""
    return ScheduledReport.objects.create(
        user=user,
        name=name,
        report_type=report_type,
        frequency=frequency,
        next_run=next_run,
    )


def generate_report_pdf(user, report_type='complete'):
    """Generate a professional PDF report for the given user and report type."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.graphics.shapes import Drawing, Rect, String
    from reportlab.graphics.charts.barcharts import VerticalBarChart
    from reportlab.graphics import renderPDF
    from django.db.models import Sum, Count, Q

    transactions = Transaction.objects.filter(user=user)
    monthly_data = list(
        transactions.annotate(month=TruncMonth('date'))
        .values('month')
        .annotate(income=Sum('amount', filter=Q(type='income')), expense=Sum('amount', filter=Q(type='expense')))
        .order_by('month')
    )

    by_category = list(
        transactions.filter(type='expense')
        .values('category__name')
        .annotate(total=Sum('amount'), count=Count('id'))
        .order_by('-total')[:8]
    )

    summary = transactions.aggregate(
        total_income=Sum('amount', filter=Q(type='income')),
        total_expense=Sum('amount', filter=Q(type='expense')),
    )
    total_income = float(summary['total_income'] or 0)
    total_expense = float(summary['total_expense'] or 0)
    net = total_income - total_expense

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=48, leftMargin=48, topMargin=48, bottomMargin=48)
    elements = []
    styles = getSampleStyleSheet()

    elements.append(Paragraph("WealthWise Financial Report", styles['Title']))
    elements.append(Paragraph(f"Generated on {timezone.now().strftime('%Y-%m-%d %H:%M')} | Period: {report_type.replace('_', ' ').title()}", styles['Normal']))
    elements.append(Spacer(1, 18))

    elements.append(Paragraph("Budget Summary", styles['Heading2']))
    summary_data = [
        ['Metric', 'Amount'],
        ['Total Income', f"₹{total_income:,.2f}"],
        ['Total Expenses', f"₹{total_expense:,.2f}"],
        ['Net Savings', f"₹{net:,.2f}"],
        ['Savings Rate', f"{(total_income and (net / total_income) * 100) or 0:.1f}%"],
    ]
    summary_table = Table(summary_data, hAlign='LEFT')
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f1f5f9')]),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 18))

    elements.append(Paragraph("Spending Overview (Monthly)", styles['Heading2']))
    monthly_table_data = [['Month', 'Income', 'Expense', 'Net']]
    for item in monthly_data[-12:]:
        month_str = item['month'].strftime('%Y-%m') if item['month'] else 'N/A'
        income = float(item['income'] or 0)
        expense = float(item['expense'] or 0)
        monthly_table_data.append([month_str, f"₹{income:,.2f}", f"₹{expense:,.2f}", f"₹{income - expense:,.2f}"])
    if len(monthly_table_data) == 1:
        monthly_table_data.append(['No data', '₹0.00', '₹0.00', '₹0.00'])

    monthly_table = Table(monthly_table_data, hAlign='LEFT')
    monthly_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f1f5f9')]),
    ]))
    elements.append(monthly_table)
    elements.append(Spacer(1, 18))

    elements.append(Paragraph("Category Breakdown", styles['Heading2']))
    if by_category:
        cat_data = [['Category', 'Transactions', 'Total']]
        for cat in by_category:
            cat_data.append([cat['category__name'] or 'Uncategorized', str(cat['count']), f"₹{float(cat['total']):,.2f}"])
        cat_table = Table(cat_data, hAlign='LEFT')
        cat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f1f5f9')]),
        ]))
        elements.append(cat_table)
    else:
        elements.append(Paragraph("No category data available for the selected period.", styles['Normal']))
    elements.append(Spacer(1, 18))

    elements.append(Paragraph("Expense Distribution", styles['Heading2']))
    if by_category:
        drawing = Drawing(400, 200)
        bc = VerticalBarChart()
        bc.x = 50
        bc.y = 50
        bc.height = 125
        bc.width = 300
        bc.data = [[float(c['total']) for c in by_category]]
        bc.categoryAxis.categoryNames = [c['category__name'][:10] for c in by_category]
        bc.bars[0].fillColor = colors.HexColor('#3b82f6')
        elements.append(drawing)
    else:
        elements.append(Paragraph("No chart data available.", styles['Normal']))

    elements.append(Spacer(1, 18))
    elements.append(Paragraph("Key Insights", styles['Heading2']))
    insights = []
    if total_income > 0:
        if net > 0:
            insights.append(f"Your savings rate is {(net / total_income) * 100:.1f}%. Keep maintaining this healthy financial habit.")
        else:
            insights.append("Your expenses exceeded income this period. Review discretionary spending to improve cash flow.")
    if by_category:
        top = by_category[0]
        insights.append(f"Highest spending category: {top['category__name']} (₹{float(top['total']):,.2f}). Consider setting a targeted budget here.")
    if not insights:
        insights.append("Start adding transactions to unlock personalized insights.")
    for i, text in enumerate(insights, 1):
        elements.append(Paragraph(f"{i}. {text}", styles['Normal']))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
