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
from .system import health_check, seed_historical_data

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
]
