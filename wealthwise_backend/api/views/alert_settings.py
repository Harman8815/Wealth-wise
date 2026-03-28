"""
Alert Setting API views for WealthWise.
Handles user alert preferences and notification settings.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from ..models import AlertSetting
from ..serializers import AlertSettingSerializer
from ..base import StandardResultsSetPagination, IsOwner


class AlertSettingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user alert settings.
    
    Settings control notification behavior for:
    - Budget: Warnings when approaching budget limits
    - Bills: Upcoming bill reminders
    - Goals: Milestone achievements
    - Security: Unusual spending alerts
    - Account: Low balance warnings
    - Investments: Investment-related notifications
    
    Each setting can have:
    - enabled: Whether notifications are active
    - threshold: Numeric threshold value
    - threshold_unit: Unit for threshold (%, ₹, etc.)
    """
    serializer_class = AlertSettingSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'enabled']
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """Return alert settings for current user."""
        return AlertSetting.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Create alert setting with current user as owner."""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """
        Toggle alert setting enabled status.
        
        Returns:
            Updated setting with new enabled state.
        """
        setting = self.get_object()
        setting.enabled = not setting.enabled
        setting.save(update_fields=['enabled'])
        
        serializer = self.get_serializer(setting)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def reset_defaults(self, request):
        """
        Reset all alert settings to defaults.
        
        Clears existing settings and creates default ones.
        
        Returns:
            List of created default settings.
        """
        user = request.user
        
        # Clear existing settings
        AlertSetting.objects.filter(user=user).delete()
        
        # Create default settings
        default_settings = [
            {
                'setting_id': 'budget_warning',
                'title': 'Budget Warnings',
                'description': 'Get notified when approaching budget limits',
                'category': 'Budget',
                'enabled': True,
                'threshold': 80,
                'threshold_unit': '%'
            },
            {
                'setting_id': 'bill_reminders',
                'title': 'Bill Reminders',
                'description': 'Receive reminders for upcoming bills',
                'category': 'Bills',
                'enabled': True
            },
            {
                'setting_id': 'goal_milestones',
                'title': 'Goal Milestones',
                'description': 'Celebrate savings achievements',
                'category': 'Goals',
                'enabled': True
            },
            {
                'setting_id': 'unusual_spending',
                'title': 'Unusual Spending Alert',
                'description': 'Alert for out-of-pattern transactions',
                'category': 'Security',
                'enabled': True,
                'threshold': 15000,
                'threshold_unit': '₹'
            },
            {
                'setting_id': 'low_balance',
                'title': 'Low Balance Alert',
                'description': 'Warning when account falls below threshold',
                'category': 'Account',
                'enabled': False,
                'threshold': 5000,
                'threshold_unit': '₹'
            },
        ]
        
        created = []
        for setting_data in default_settings:
            setting = AlertSetting.objects.create(user=user, **setting_data)
            created.append(setting)
        
        serializer = self.get_serializer(created, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get summary of alert settings.
        
        Returns:
            total_settings: Total number of settings
            enabled_count: Number of enabled settings
            disabled_count: Number of disabled settings
            by_category: Settings grouped by category
        """
        settings = self.get_queryset()
        
        enabled = settings.filter(enabled=True).count()
        disabled = settings.filter(enabled=False).count()
        
        by_category = {}
        for setting in settings:
            cat = setting.category
            if cat not in by_category:
                by_category[cat] = {'enabled': 0, 'disabled': 0, 'total': 0}
            by_category[cat]['total'] += 1
            if setting.enabled:
                by_category[cat]['enabled'] += 1
            else:
                by_category[cat]['disabled'] += 1
        
        return Response({
            'total_settings': settings.count(),
            'enabled_count': enabled,
            'disabled_count': disabled,
            'by_category': by_category
        })
