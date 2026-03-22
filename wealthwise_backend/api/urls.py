from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'accounts', views.AccountViewSet, basename='account')
router.register(r'transactions', views.TransactionViewSet, basename='transaction')
router.register(r'budget-categories', views.BudgetCategoryViewSet, basename='budgetcategory')
router.register(r'goals', views.GoalViewSet, basename='goal')
router.register(r'alerts', views.AlertViewSet, basename='alert')
router.register(r'alert-settings', views.AlertSettingViewSet, basename='alertsetting')
router.register(r'expenses', views.ExpenseViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('health/', views.health_check, name='health_check'),
    path('seed-data/', views.seed_historical_data, name='seed_data'),
]
