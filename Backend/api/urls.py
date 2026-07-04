"""
URL routing for WealthWise API.
All API endpoints are registered via DefaultRouter.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    UserViewSet,
    AccountViewSet,
    TransactionViewSet,
    BudgetCategoryViewSet,
    GoalViewSet,
    AlertViewSet,
    AlertSettingViewSet,
    ExpenseViewSet,
    CategoryViewSet,
    health_check,
    seed_historical_data,
    default_user_info,
    export_transactions_csv,
    export_reports_pdf,
    filter_reports,
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'budget-categories', BudgetCategoryViewSet, basename='budgetcategory')
router.register(r'goals', GoalViewSet, basename='goal')
router.register(r'alerts', AlertViewSet, basename='alert')
router.register(r'alert-settings', AlertSettingViewSet, basename='alertsetting')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'categories', CategoryViewSet, basename='category')

# URL patterns
urlpatterns = [
    # API router endpoints
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # System endpoints
    path('health/', health_check, name='health_check'),
    path('seed-data/', seed_historical_data, name='seed_data'),
    path('default-user/', default_user_info, name='default_user_info'),
    path('transactions/export_csv/', export_transactions_csv, name='transactions_export_csv'),
    path('reports/filter/', filter_reports, name='reports_filter'),
    path('reports/export_pdf/', export_reports_pdf, name='reports_export_pdf'),
]
