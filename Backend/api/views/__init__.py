"""
Views package for WealthWise API.
Each entity has its own module for better organization and maintainability.
"""
from .users import UserViewSet
from .accounts import AccountViewSet
from .transactions import TransactionViewSet
from .budget_categories import BudgetCategoryViewSet
from .goals import GoalViewSet
from .alerts import AlertViewSet
from .alert_settings import AlertSettingViewSet
from .expenses import ExpenseViewSet
from .categories import CategoryViewSet
from .recurring import RecurringRuleViewSet
from .recurring_budgets import RecurringBudgetViewSet
from .projects import ProjectViewSet, accept_invitation
from .financial_health import FinancialHealthViewSet
from .system import health_check, seed_historical_data, default_user_info, quick_login
from .reports import export_reports_pdf, filter_reports, scheduled_reports, scheduled_report_detail, trigger_scheduled_report, generate_pdf_report
from .data_io import (
    import_upload,
    import_commit,
    import_history,
    mapping_templates,
    export_data,
    export_history,
)

__all__ = [
    'UserViewSet',
    'AccountViewSet',
    'TransactionViewSet',
    'BudgetCategoryViewSet',
    'GoalViewSet',
    'AlertViewSet',
    'AlertSettingViewSet',
    'ExpenseViewSet',
    'CategoryViewSet',
    'RecurringRuleViewSet',
    'RecurringBudgetViewSet',
    'ProjectViewSet',
    'FinancialHealthViewSet',
    'accept_invitation',
    'health_check',
    'seed_historical_data',
    'default_user_info',
    'quick_login',
    'export_reports_pdf',
    'filter_reports',
    'scheduled_reports',
    'scheduled_report_detail',
    'trigger_scheduled_report',
    'generate_pdf_report',
    'import_upload',
    'import_commit',
    'import_history',
    'mapping_templates',
    'export_data',
    'export_history',
]
