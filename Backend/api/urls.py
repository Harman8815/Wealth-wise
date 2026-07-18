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
    RecurringRuleViewSet,
    RecurringBudgetViewSet,
    ProjectViewSet,
    FinancialHealthViewSet,
    FinancialHealthViewSet,
    accept_invitation,
    health_check,
    seed_historical_data,
    default_user_info,
    quick_login,
    export_reports_pdf,
    filter_reports,
    scheduled_reports,
    scheduled_report_detail,
    trigger_scheduled_report,
    generate_pdf_report,
    import_upload,
    import_commit,
    import_history,
    mapping_templates,
    export_data,
    export_history,
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
router.register(r'recurring', RecurringRuleViewSet, basename='recurringrule')
router.register(r'recurring-budgets', RecurringBudgetViewSet, basename='recurringbudget')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'financial-health', FinancialHealthViewSet, basename='financialhealth')

# URL patterns
urlpatterns = [
    # Project invitation acceptance (registered before the router so it is not
    # captured by the router's project detail route).
    path('projects/accept-invitation/', accept_invitation, name='accept_invitation'),

    # API router endpoints
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/quick-login/', quick_login, name='quick_login'),
    
    # System endpoints
    path('health/', health_check, name='health_check'),
    path('seed-data/', seed_historical_data, name='seed_data'),
    path('default-user/', default_user_info, name='default_user_info'),
    path('imports/upload/', import_upload, name='imports_upload'),
    path('imports/<uuid:job_id>/commit/', import_commit, name='imports_commit'),
    path('imports/history/', import_history, name='imports_history'),
    path('imports/mapping-templates/', mapping_templates, name='mapping_templates'),
    path('imports/mapping-templates/<uuid:template_id>/', mapping_templates, name='mapping_template_detail'),
    path('exports/', export_data, name='exports'),
    path('exports/history/', export_history, name='exports_history'),
    path('reports/filter/', filter_reports, name='reports_filter'),
    path('reports/export_pdf/', export_reports_pdf, name='reports_export_pdf'),
    path('reports/schedules/', scheduled_reports, name='scheduled_reports'),
    path('reports/schedules/<uuid:id>/', scheduled_report_detail, name='scheduled_report_detail'),
    path('reports/schedules/<uuid:id>/trigger/', trigger_scheduled_report, name='scheduled_reports_trigger'),
    path('reports/generate_pdf/', generate_pdf_report, name='reports_generate_pdf'),
]
