import factory
from factory.django import DjangoModelFactory
from factory import fuzzy
import uuid
from decimal import Decimal
from datetime import date, datetime, timedelta

from ..models import (
    User, Project, ProjectMember, ProjectInvitation,
    Account, Transaction, TransactionHistory,
    Category, BudgetCategory,
    Goal, Alert, AlertSetting,
    Expense, ScheduledReport,
    RecurringRule, RecurringExecution,
    RecurringBudget, RecurringBudgetExecution,
    ImportJob, ExportJob, MappingTemplate,
    FinancialHealthScore, ScoreDimensionConfig, HealthRecommendation,
    DuplicateGroup, DuplicateMatch, DuplicateFeedback,
    Insight,
)


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
        django_get_or_create = ('email',)

    id = factory.LazyFunction(uuid.uuid4)
    email = factory.Sequence(lambda n: f'user{n}@wealthwise.test')
    name = factory.Faker('name')
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')
    currency = 'INR'
    language = 'en'
    theme = 'system'
    is_active = True
    is_staff = False
    email_verified = False

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        if extracted:
            self.set_password(extracted)
            self.save()


class ProjectFactory(DjangoModelFactory):
    class Meta:
        model = Project

    id = factory.LazyFunction(uuid.uuid4)
    name = factory.Faker('company')
    description = factory.Faker('sentence')
    currency = 'INR'
    icon = 'wallet'
    color = '#3b82f6'
    initial_budget = Decimal('0')
    created_by = factory.SubFactory(UserFactory)
    created_at = factory.LazyFunction(datetime.now)
    updated_at = factory.LazyFunction(datetime.now)


class ProjectMemberFactory(DjangoModelFactory):
    class Meta:
        model = ProjectMember
        django_get_or_create = ('project', 'user')

    id = factory.LazyFunction(uuid.uuid4)
    project = factory.SubFactory(ProjectFactory)
    user = factory.SubFactory(UserFactory)
    role = 'viewer'
    invited_by = factory.SelfAttribute('project.created_by')
    joined_at = factory.LazyFunction(datetime.now)


class ProjectInvitationFactory(DjangoModelFactory):
    class Meta:
        model = ProjectInvitation

    id = factory.LazyFunction(uuid.uuid4)
    project = factory.SubFactory(ProjectFactory)
    email = factory.LazyAttribute(lambda o: o.user.email if hasattr(o, 'user') else 'invited@wealthwise.test')
    role = 'editor'
    invited_by = factory.SelfAttribute('project.created_by')
    status = 'pending'
    token = factory.LazyFunction(uuid.uuid4)
    created_at = factory.LazyFunction(datetime.now)
    expires_at = factory.LazyFunction(lambda: datetime.now() + timedelta(days=7))


class CategoryFactory(DjangoModelFactory):
    class Meta:
        model = Category
        django_get_or_create = ('user', 'project', 'name', 'type')

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    name = factory.Faker('word')
    type = 'expense'
    color = '#3b82f6'
    text_color = '#ffffff'
    icon = 'utensils'
    symbol = 'utensils'
    is_default = False
    created_at = factory.LazyFunction(datetime.now)
    updated_at = factory.LazyFunction(datetime.now)


class AccountFactory(DjangoModelFactory):
    class Meta:
        model = Account

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    name = factory.Faker('company')
    type = 'bank'
    balance = Decimal('0')
    currency = 'INR'
    is_active = True
    bank_name = ''
    account_number = ''
    created_at = factory.LazyFunction(datetime.now)
    updated_at = factory.LazyFunction(datetime.now)


class TransactionFactory(DjangoModelFactory):
    class Meta:
        model = Transaction

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    account = factory.SubFactory(AccountFactory, user=factory.SelfAttribute('..user'), project=factory.SelfAttribute('..project'))
    date = factory.Faker('date_this_year')
    description = factory.Faker('sentence')
    category = factory.SubFactory(CategoryFactory, user=factory.SelfAttribute('..user'), project=factory.SelfAttribute('..project'))
    amount = Decimal('100.00')
    type = 'expense'
    status = 'completed'
    account_name = factory.SelfAttribute('account.name')
    created_at = factory.LazyFunction(datetime.now)
    updated_at = factory.LazyFunction(datetime.now)


class TransactionHistoryFactory(DjangoModelFactory):
    class Meta:
        model = TransactionHistory

    id = factory.LazyFunction(uuid.uuid4)
    transaction = factory.SubFactory(TransactionFactory)
    user = factory.SelfAttribute('transaction.user')
    project = factory.SelfAttribute('transaction.project')
    changed_at = factory.LazyFunction(datetime.now)
    changed_by = factory.SelfAttribute('transaction.user')
    field_name = 'amount'
    old_value = '100.00'
    new_value = '200.00'


class BudgetCategoryFactory(DjangoModelFactory):
    class Meta:
        model = BudgetCategory
        django_get_or_create = ('user', 'project', 'name')

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    name = factory.Faker('word')
    category = factory.SubFactory(CategoryFactory, user=factory.SelfAttribute('..user'), project=factory.SelfAttribute('..project'))
    budgeted = Decimal('5000.00')
    spent = Decimal('0')
    color = '#3b82f6'
    text_color = '#ffffff'
    icon = 'utensils'
    symbol = 'utensils'
    created_at = factory.LazyFunction(datetime.now)
    updated_at = factory.LazyFunction(datetime.now)


class GoalFactory(DjangoModelFactory):
    class Meta:
        model = Goal

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    title = factory.Faker('sentence')
    description = factory.Faker('text')
    target_amount = Decimal('100000.00')
    current_amount = Decimal('0')
    target_date = factory.Faker('date_between', start_date='+30d', end_date='+365d')
    category = 'Emergency'
    priority = 'medium'
    status = 'active'
    created_at = factory.LazyFunction(datetime.now)
    updated_at = factory.LazyFunction(datetime.now)
    completed_at = None


class AlertFactory(DjangoModelFactory):
    class Meta:
        model = Alert

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    type = 'info'
    title = factory.Faker('sentence')
    message = factory.Faker('text')
    category = 'System'
    priority = 'medium'
    dismissed = False
    dedup_key = ''
    timestamp = factory.LazyFunction(datetime.now)
    read = False
    read_at = None
    action_url = ''
    created_at = factory.LazyFunction(datetime.now)


class AlertSettingFactory(DjangoModelFactory):
    class Meta:
        model = AlertSetting

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    setting_id = factory.Faker('word')
    title = factory.Faker('sentence')
    description = factory.Faker('text')
    category = 'Budget'
    enabled = True
    threshold = Decimal('80.00')
    threshold_unit = '%'
    created_at = factory.LazyFunction(datetime.now)
    updated_at = factory.LazyFunction(datetime.now)


class ExpenseFactory(DjangoModelFactory):
    class Meta:
        model = Expense

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    date = factory.Faker('date_this_year')
    category = factory.SubFactory(CategoryFactory, user=factory.SelfAttribute('..user'), project=factory.SelfAttribute('..project'))
    amount = Decimal('50.00')
    note = factory.Faker('sentence')
    receipt_url = ''
    created_at = factory.LazyFunction(datetime.now)
    updated_at = factory.LazyFunction(datetime.now)


class ScheduledReportFactory(DjangoModelFactory):
    class Meta:
        model = ScheduledReport

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    name = factory.Faker('sentence')
    report_type = 'complete'
    frequency = 'monthly'
    enabled = True
    last_run = None
    next_run = factory.LazyFunction(lambda: datetime.now() + timedelta(days=30))
    created_at = factory.LazyFunction(datetime.now)
    updated_at = factory.LazyFunction(datetime.now)


class RecurringRuleFactory(DjangoModelFactory):
    class Meta:
        model = RecurringRule

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    name = factory.Faker('sentence')
    description = factory.Faker('text')
    amount = Decimal('1000.00')
    type = 'expense'
    category = factory.SubFactory(CategoryFactory, user=factory.SelfAttribute('..user'), project=factory.SelfAttribute('..project'))
    category_name = ''
    account = None
    status = 'active'
    frequency = 'monthly'
    interval = 1
    weekdays = []
    day_of_month = 1
    last_day_of_month = False
    start_date = date(2020, 1, 1)
    end_date = None
    never_ends = True
    next_execution_date = date(2024, 1, 1)
    last_execution_date = None
    execution_count = 0
    created_at = factory.LazyFunction(datetime.now)
    updated_at = factory.LazyFunction(datetime.now)


class RecurringExecutionFactory(DjangoModelFactory):
    class Meta:
        model = RecurringExecution

    id = factory.LazyFunction(uuid.uuid4)
    rule = factory.SubFactory(RecurringRuleFactory)
    user = factory.SelfAttribute('rule.user')
    project = factory.SelfAttribute('rule.project')
    transaction = None
    scheduled_date = date(2024, 1, 1)
    executed_at = None
    status = 'pending'
    error = ''
    created_at = factory.LazyFunction(datetime.now)


class RecurringBudgetFactory(DjangoModelFactory):
    class Meta:
        model = RecurringBudget

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    name = factory.Faker('sentence')
    description = factory.Faker('text')
    total_budget = Decimal('10000.00')
    categories = factory.List([factory.Dict({'name': 'Food', 'budgeted': 5000, 'color': '#ef4444', 'symbol': 'utensils'})])
    strategy = 'copy_structure'
    adjustment_percent = Decimal('0')
    auto_carry_forward = False
    auto_adjust_previous = False
    status = 'active'
    frequency = 'monthly'
    interval = 1
    weekdays = []
    day_of_month = 1
    last_day_of_month = False
    start_date = date(2020, 1, 1)
    end_date = None
    never_ends = True
    next_generation_date = date(2024, 1, 1)
    last_generation_date = None
    generation_count = 0
    created_at = factory.LazyFunction(datetime.now)
    updated_at = factory.LazyFunction(datetime.now)


class RecurringBudgetExecutionFactory(DjangoModelFactory):
    class Meta:
        model = RecurringBudgetExecution

    id = factory.LazyFunction(uuid.uuid4)
    rule = factory.SubFactory(RecurringBudgetFactory)
    user = factory.SelfAttribute('rule.user')
    project = factory.SelfAttribute('rule.project')
    generated_budgets = []
    scheduled_date = date(2024, 1, 1)
    executed_at = None
    status = 'pending'
    error = ''
    created_at = factory.LazyFunction(datetime.now)


class ImportJobFactory(DjangoModelFactory):
    class Meta:
        model = ImportJob

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    filename = factory.Faker('file_name')
    status = 'parsed'
    format = 'csv'
    mapping = factory.Dict({})
    snapshot = []
    total_rows = 0
    valid_rows = 0
    imported_rows = 0
    error = ''
    created_at = factory.LazyFunction(datetime.now)


class ExportJobFactory(DjangoModelFactory):
    class Meta:
        model = ExportJob

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    dataset = 'transactions'
    format = 'csv'
    row_count = 0
    status = 'completed'
    created_at = factory.LazyFunction(datetime.now)


class MappingTemplateFactory(DjangoModelFactory):
    class Meta:
        model = MappingTemplate

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    name = factory.Faker('sentence')
    mapping = factory.Dict({})
    created_at = factory.LazyFunction(datetime.now)
    updated_at = factory.LazyFunction(datetime.now)


class FinancialHealthScoreFactory(DjangoModelFactory):
    class Meta:
        model = FinancialHealthScore

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    score = Decimal('75.00')
    grade = 'B'
    grade_label = 'Good'
    previous_score = None
    trend = 'flat'
    dimensions = factory.List([])
    strengths = factory.List([])
    risks = factory.List([])
    period_start = None
    period_end = None
    computed_at = factory.LazyFunction(datetime.now)


class ScoreDimensionConfigFactory(DjangoModelFactory):
    class Meta:
        model = ScoreDimensionConfig
        django_get_or_create = ('user', 'project', 'dimension')

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    dimension = 'savings_ratio'
    weight = Decimal('0.150')
    enabled = True
    created_at = factory.LazyFunction(datetime.now)
    updated_at = factory.LazyFunction(datetime.now)


class HealthRecommendationFactory(DjangoModelFactory):
    class Meta:
        model = HealthRecommendation

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    score_snapshot = factory.SubFactory(FinancialHealthScoreFactory)
    dimension = 'savings_ratio'
    title = factory.Faker('sentence')
    detail = factory.Faker('text')
    estimated_improvement = Decimal('5.00')
    priority = 'medium'
    resolved = False
    created_at = factory.LazyFunction(datetime.now)


class InsightFactory(DjangoModelFactory):
    class Meta:
        model = Insight

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    kind = 'spending'
    title = factory.Faker('sentence')
    description = factory.Faker('text')
    severity = 'neutral'
    dedup_key = factory.Faker('word')
    metadata = factory.Dict({})
    action_url = ''
    dismissed = False
    generated_at = factory.LazyFunction(datetime.now)


class DuplicateGroupFactory(DjangoModelFactory):
    class Meta:
        model = DuplicateGroup

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    status = 'open'
    detected_at = factory.LazyFunction(datetime.now)
    created_at = factory.LazyFunction(datetime.now)


class DuplicateMatchFactory(DjangoModelFactory):
    class Meta:
        model = DuplicateMatch

    id = factory.LazyFunction(uuid.uuid4)
    group = factory.SubFactory(DuplicateGroupFactory)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    transaction = factory.SubFactory(TransactionFactory, user=factory.SelfAttribute('..user'), project=factory.SelfAttribute('..project'))
    duplicate_of = factory.SubFactory(TransactionFactory, user=factory.SelfAttribute('..user'), project=factory.SelfAttribute('..project'))
    score = Decimal('0.9000')
    confidence = 'high'
    features = factory.Dict({'description_sim': 0.9, 'amount_sim': 1.0, 'date_sim': 0.75})
    explanation = 'Same amount, 1 day apart.'
    resolution = 'pending'
    created_at = factory.LazyFunction(datetime.now)


class DuplicateFeedbackFactory(DjangoModelFactory):
    class Meta:
        model = DuplicateFeedback

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    transaction_a = factory.SubFactory(TransactionFactory, user=factory.SelfAttribute('..user'), project=factory.SelfAttribute('..project'))
    transaction_b = factory.SubFactory(TransactionFactory, user=factory.SelfAttribute('..user'), project=factory.SelfAttribute('..project'))
    label = 'not_duplicate'
    created_at = factory.LazyFunction(datetime.now)
