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
from .projects import ProjectViewSet, accept_invitation
from .system import health_check, seed_historical_data, default_user_info, quick_login
from .reports import export_transactions_csv, export_reports_pdf, filter_reports, scheduled_reports, scheduled_report_detail, trigger_scheduled_report, generate_pdf_report

__all__ = [
    'UserViewSet',
    'AccountViewSet',
    'TransactionViewSet',
    'BudgetCategoryViewSet',
    'GoalViewSet',
    'AlertViewSet',
    'AlertSettingViewSet',
    'ExpenseViewSet',
    'ProjectViewSet',
    'accept_invitation',
    'health_check',
    'seed_historical_data',
    'default_user_info',
    'quick_login',
    'export_transactions_csv',
    'export_reports_pdf',
    'filter_reports',
    'scheduled_reports',
    'scheduled_report_detail',
    'trigger_scheduled_report',
    'generate_pdf_report',
]
