"""
Alert API views for WealthWise.
Handles user notifications and system alerts.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from ..models import Alert
from ..serializers import AlertSerializer
from ..base import StandardResultsSetPagination, IsOwner, project_scope_filter
from ..services.alert_engine import generate_user_alerts


class AlertViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user alerts and notifications.
    
    Alert types:
    - warning: Budget warnings, low balance
    - info: General information, reminders
    - success: Goal achievements, milestones
    - error: Errors, unauthorized transactions
    
    Categories: Budget, Bills, Goals, Security, Account, Investments
    
    Supports bulk marking as read/unread.
    """
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type', 'category', 'priority', 'read', 'dismissed']
    pagination_class = StandardResultsSetPagination

    _PRIORITY_ORDER = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}

    def get_queryset(self):
        """Return alerts for current user (and active project).

        Critical/high priority alerts are pinned to the top so persistent
        alerts remain visible until acknowledged, then everything is ordered
        by recency.
        """
        from django.db.models import Case, When, Value, IntegerField
        queryset = Alert.objects.filter(
            user=self.request.user, **project_scope_filter(self.request)
        )
        queryset = queryset.annotate(
            _priority_rank=Case(
                *[
                    When(priority=p, then=Value(rank))
                    for p, rank in self._PRIORITY_ORDER.items()
                ],
                default=Value(4),
                output_field=IntegerField(),
            )
        )
        return queryset.order_by('-_priority_rank', '-timestamp')

    def perform_create(self, serializer):
        """Create alert with current user as owner."""
        serializer.save(user=self.request.user, project=self.request.active_project)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Mark a single alert as read.
        
        Returns:
            Success status with updated read state.
        """
        alert = self.get_object()
        alert.mark_as_read()
        return Response({'status': 'alert marked as read', 'read': True})

    @action(detail=True, methods=['post'])
    def mark_unread(self, request, pk=None):
        """
        Mark a single alert as unread.
        
        Returns:
            Success status with updated read state.
        """
        alert = self.get_object()
        alert.read = False
        alert.read_at = None
        alert.save(update_fields=['read', 'read_at'])
        return Response({'status': 'alert marked as unread', 'read': False})

    @action(detail=True, methods=['post'])
    def mark_dismissed(self, request, pk=None):
        """
        Dismiss a persistent alert so it no longer appears in the active feed.

        Persistent (critical/high) alerts remain visible until dismissed.
        """
        alert = self.get_object()
        alert.dismiss()
        return Response({'status': 'alert dismissed', 'dismissed': True})

    @action(detail=False, methods=['post'])
    def dismiss_all(self, request):
        """Dismiss all currently-active persistent alerts for the user."""
        updated = Alert.objects.filter(
            user=request.user,
            project=getattr(request, 'active_project', None),
            dismissed=False,
        ).filter(priority__in=['critical', 'high']).update(dismissed=True)
        return Response({'status': 'persistent alerts dismissed', 'dismissed_count': updated})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        Mark all unread alerts as read for the current user.
        
        Returns:
            Number of alerts marked as read.
        """
        updated = Alert.objects.filter(
            user=request.user,
            project=getattr(request, 'active_project', None),
            read=False
        ).update(read=True, read_at=timezone.now())
        
        return Response({
            'status': 'all alerts marked as read',
            'marked_count': updated
        })

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Get count of unread, non-dismissed alerts.

        Persistent (critical/high) alerts that have not been dismissed are
        still counted even when read, because they must be acknowledged.

        Returns:
            unread_count: Number of active notifications requiring attention
            total_count: Total number of alerts
        """
        queryset = self.get_queryset()
        unread = queryset.filter(read=False, dismissed=False).count()
        total = queryset.count()
        
        return Response({
            'unread_count': unread,
            'total_count': total
        })

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """
        Get alert counts grouped by category.
        
        Returns:
            Categories with unread and total counts.
        """
        queryset = self.get_queryset()
        
        categories = {}
        for alert in queryset:
            cat = alert.category
            if cat not in categories:
                categories[cat] = {'unread': 0, 'total': 0}
            categories[cat]['total'] += 1
            if not alert.read:
                categories[cat]['unread'] += 1
        
        return Response([
            {
                'category': cat,
                'unread': counts['unread'],
                'total': counts['total']
            }
            for cat, counts in categories.items()
        ])

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Generate alerts for the current user based on budget data and preferences.

        Evaluates the configured alert rules (overall budget exceeded, specific
        category budget exceeded, approaching threshold) and creates Alert rows
        for conditions the user has enabled. Does not mark any alerts as read.

        Returns:
            generated: Number of alerts created.
        """
        generated = generate_user_alerts(request.user, project=getattr(request, 'active_project', None))
        return Response({'generated': generated})
