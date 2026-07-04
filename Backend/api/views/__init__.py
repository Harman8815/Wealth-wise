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
from .system import health_check, seed_historical_data, default_user_info
from .reports import export_transactions_csv, export_reports_pdf, filter_reports

__all__ = [
    'UserViewSet',
    'AccountViewSet',
    'TransactionViewSet',
    'BudgetCategoryViewSet',
    'GoalViewSet',
    'AlertViewSet',
    'AlertSettingViewSet',
    'ExpenseViewSet',
    'health_check',
    'seed_historical_data',
    'default_user_info',
    'export_transactions_csv',
    'export_reports_pdf',
    'filter_reports',
]
