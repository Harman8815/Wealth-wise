"""
Generic model registry for the Studio management UI.

Maps a URL slug -> a model class plus display configuration. The config is
derived by introspecting each model's fields (choices, booleans, FKs, dates,
JSON blobs) but can be overridden per model below.

Keeping this in one place lets `views.py`, `forms.py` and the templates stay
generic so we never have to hand-write 25 list views or forms.
"""
from django.db import models
from django.db.models import JSONField, DateField, BooleanField, ForeignKey, CharField

from api.models import (
    User, Account, Transaction, TransactionHistory, BudgetCategory, Goal,
    Alert, AlertSetting, Category, Expense, ScheduledReport, RecurringRule,
    RecurringExecution, RecurringBudget, RecurringBudgetExecution, Project,
    ProjectMember, ProjectInvitation, ImportJob, ExportJob, MappingTemplate,
    Insight,
)
from api.models_financial_health import (
    ScoreDimensionConfig, FinancialHealthScore, HealthRecommendation,
)
from api.models_duplicates import DuplicateGroup, DuplicateMatch, DuplicateFeedback
from api.models_subscriptions import Subscription, SubscriptionFeedback

# Heavy JSON blobs we never want in an auto-generated form.
JSON_BLACKLIST = {
    'RecurringRule': {'weekdays'},
    'RecurringBudget': {'weekdays', 'categories'},
    'ImportJob': {'mapping', 'snapshot'},
    'ExportJob': set(),
    'MappingTemplate': {'mapping'},
}

# Models with auto-managed computed/audit fields we should hide from create/edit.
READONLY_FIELDS = {
    'TransactionHistory', 'RecurringExecution', 'RecurringBudgetExecution',
    'FinancialHealthScore', 'HealthRecommendation', 'DuplicateGroup',
    'DuplicateMatch', 'DuplicateFeedback', 'Subscription', 'SubscriptionFeedback',
    'Insight', 'Alert', 'Account', 'Project',
}

# Fields that should never appear in a create/edit form even if editable.
GLOBAL_FIELD_BLACKLIST = {
    'id', 'created_at', 'updated_at', 'last_login', 'password',
    'last_execution_date', 'next_execution_date', 'execution_count',
    'last_generation_date', 'next_generation_date', 'generation_count',
    'last_generated_budget', 'total_budget',
}


def _auto_filter_type(field):
    if field.choices:
        return 'choice'
    if isinstance(field, BooleanField):
        return 'boolean'
    if isinstance(field, ForeignKey):
        return 'fk'
    if isinstance(field, DateField):
        return 'date'
    return 'text'


def _is_json_field(field):
    return isinstance(field, JSONField)


def build_registry():
    """Introspect every target model and produce the registry dict."""
    entries = {}

    # (slug, model, group, label)
    definitions = [
        ('users', User, 'Core', 'Users'),
        ('projects', Project, 'Core', 'Projects'),
        ('accounts', Account, 'Core', 'Accounts'),
        ('categories', Category, 'Core', 'Categories'),
        ('transactions', Transaction, 'Money', 'Transactions'),
        ('expenses', Expense, 'Money', 'Expenses'),
        ('budget-categories', BudgetCategory, 'Money', 'Budgets'),
        ('goals', Goal, 'Money', 'Goals'),
        ('recurring-rules', RecurringRule, 'Money', 'Recurring'),
        ('recurring-executions', RecurringExecution, 'Money', 'Recurring Runs'),
        ('recurring-budgets', RecurringBudget, 'Money', 'Recurring Budgets'),
        ('recurring-budget-executions', RecurringBudgetExecution, 'Money', 'Budget Runs'),
        ('alerts', Alert, 'Signals', 'Alerts'),
        ('alert-settings', AlertSetting, 'Signals', 'Alert Settings'),
        ('insights', Insight, 'Signals', 'Insights'),
        ('subscriptions', Subscription, 'Signals', 'Subscriptions'),
        ('subscription-feedback', SubscriptionFeedback, 'Signals', 'Subscription Feedback'),
        ('financial-health', FinancialHealthScore, 'Health', 'Financial Health'),
        ('health-recommendations', HealthRecommendation, 'Health', 'Health Recs'),
        ('score-dimension-config', ScoreDimensionConfig, 'Health', 'Score Config'),
        ('imports', ImportJob, 'Ops', 'Imports'),
        ('exports', ExportJob, 'Ops', 'Exports'),
        ('mapping-templates', MappingTemplate, 'Ops', 'Mapping Templates'),
        ('transaction-history', TransactionHistory, 'Ops', 'Txn History'),
        ('duplicate-groups', DuplicateGroup, 'Ops', 'Duplicate Groups'),
        ('duplicate-matches', DuplicateMatch, 'Ops', 'Duplicate Matches'),
        ('duplicate-feedback', DuplicateFeedback, 'Ops', 'Duplicate Feedback'),
        ('project-members', ProjectMember, 'Core', 'Project Members'),
        ('project-invitations', ProjectInvitation, 'Core', 'Invitations'),
    ]

    for slug, model, group, label in definitions:
        model_name = model.__name__
        json_blacklist = JSON_BLACKLIST.get(model_name, set())
        readonly = READONLY_FIELDS if model_name in READONLY_FIELDS else set()

        list_fields = []
        search_fields = []
        filter_fields = {}

        for field in model._meta.fields:
            fname = field.name
            if fname in GLOBAL_FIELD_BLACKLIST:
                continue
            if _is_json_field(field) and fname in json_blacklist:
                continue

            verbose = field.verbose_name.title()

            # Choose a sensible column to show in the list.
            if isinstance(field, (ForeignKey,)):
                list_fields.append(fname)
            elif field.choices:
                list_fields.append(fname)
            elif isinstance(field, (BooleanField,)):
                list_fields.append(fname)
            elif isinstance(field, (CharField,)):
                list_fields.append(fname)
                search_fields.append(fname)
            elif fname in ('amount', 'balance', 'budgeted', 'spent', 'target_amount',
                           'current_amount', 'total_rows', 'valid_rows', 'imported_rows',
                           'row_count', 'net', 'score', 'weight'):
                list_fields.append(fname)
            elif isinstance(field, DateField):
                list_fields.append(fname)
            elif fname in ('email', 'name', 'title', 'description', 'note', 'message',
                           'category', 'type', 'status', 'frequency', 'priority', 'role',
                           'symbol', 'icon', 'strategy'):
                list_fields.append(fname)

            # Build filter widgets.
            if isinstance(field, ForeignKey):
                filter_fields[fname] = 'fk'
            elif field.choices:
                filter_fields[fname] = 'choice'
            elif isinstance(field, BooleanField):
                filter_fields[fname] = 'boolean'
            elif isinstance(field, DateField):
                filter_fields[fname] = 'date'

        entries[slug] = {
            'model': model,
            'group': group,
            'label': label,
            'list_fields': list_fields or ['__str__'],
            'search_fields': search_fields,
            'filter_fields': filter_fields,
            'readonly': readonly,
            'json_blacklist': json_blacklist,
        }

    return entries


REGISTRY = build_registry()


def grouped_registry():
    """Return registry entries grouped by `group` for the sidebar."""
    groups = {}
    for slug, entry in REGISTRY.items():
        groups.setdefault(entry['group'], []).append((slug, entry))
    return groups


def get_entry(slug):
    return REGISTRY.get(slug)
