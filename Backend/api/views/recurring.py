"""
Recurring Transactions API views for WealthWise.

Exposes CRUD for ``RecurringRule`` plus lifecycle actions (pause/resume,
trigger an immediate execution, list executions, preview upcoming dates, and a
global "process due rules" endpoint). Generation logic lives in
``services.recurring`` so the scheduling engine stays UI-independent.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from ..models import RecurringRule, RecurringExecution, Category
from ..serializers import RecurringRuleSerializer, RecurringExecutionSerializer
from ..base import StandardResultsSetPagination, IsOwner, project_scope_filter
from ..services.recurring import (
    execute_rule,
    run_due_rules,
    recompute_next_execution,
    get_upcoming_preview,
)
from ..services.notifications import (
    notify_recurring_paused,
    notify_recurring_resumed,
    notify_recurring_completed,
)


class RecurringRuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing recurring transaction rules.

    Frequencies: daily, weekly, monthly, quarterly, yearly, custom.
    Status: active, paused, completed.

    The rule stores a generic schedule description so it can later back
    recurring budgets, subscriptions, bill reminders and other events.
    """

    serializer_class = RecurringRuleSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type', 'status', 'frequency']
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return RecurringRule.objects.filter(
            user=self.request.user, **project_scope_filter(self.request)
        ).select_related('category', 'account').order_by('-created_at')

    def perform_create(self, serializer):
        category = serializer.validated_data.get('category')
        if category is None:
            category_name = serializer.validated_data.get('category_name')
            if category_name:
                category, _ = Category.objects.get_or_create(
                    user=self.request.user,
                    name=category_name,
                    type='expense' if serializer.validated_data.get('type') == 'expense' else 'income',
                    project=self.request.active_project,
                    defaults={
                        'color': '#3b82f6',
                        'text_color': '#ffffff',
                        'icon': 'utensils',
                        'symbol': 'utensils',
                        'is_default': False,
                    },
                )
                serializer.validated_data['category'] = category
        rule = serializer.save(user=self.request.user, project=self.request.active_project)
        recompute_next_execution(rule)

    def perform_update(self, serializer):
        category = serializer.validated_data.get('category')
        if category is None and serializer.validated_data.get('category_name'):
            category_name = serializer.validated_data['category_name']
            category, _ = Category.objects.get_or_create(
                user=self.request.user,
                name=category_name,
                type='expense' if serializer.validated_data.get('type') == 'expense' else 'income',
                project=self.request.active_project,
                defaults={
                    'color': '#3b82f6',
                    'text_color': '#ffffff',
                    'icon': 'utensils',
                    'symbol': 'utensils',
                    'is_default': False,
                },
            )
            serializer.validated_data['category'] = category
        rule = serializer.save()
        recompute_next_execution(rule)

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause the rule without deleting it."""
        rule = self.get_object()
        if rule.status == 'completed':
            return Response(
                {'error': 'Cannot pause a completed rule.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        rule.status = 'paused'
        rule.save(update_fields=['status', 'updated_at'])
        notify_recurring_paused(rule)
        return Response(self.get_serializer(rule).data)

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume a paused rule."""
        rule = self.get_object()
        rule.status = 'active'
        rule.save(update_fields=['status', 'updated_at'])
        recompute_next_execution(rule)
        notify_recurring_resumed(rule)
        return Response(self.get_serializer(rule).data)

    @action(detail=True, methods=['post'])
    def generate_now(self, request, pk=None):
        """Immediately execute the rule for today (used for manual trigger)."""
        rule = self.get_object()
        if rule.status == 'completed':
            return Response(
                {'error': 'Cannot execute a completed rule.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        as_of = timezone.localdate()
        execution = execute_rule(rule, as_of)
        return Response(
            {
                'execution': RecurringExecutionSerializer(execution).data,
                'rule': self.get_serializer(rule).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['get'])
    def executions(self, request, pk=None):
        """List recorded executions for this rule."""
        rule = self.get_object()
        qs = RecurringExecution.objects.filter(rule=rule).order_by('-scheduled_date')
        page = self.paginate_queryset(qs)
        serializer = RecurringExecutionSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=['get'])
    def upcoming(self, request, pk=None):
        """Preview the next few scheduled execution dates."""
        rule = self.get_object()
        count = int(request.query_params.get('count', 5))
        dates = get_upcoming_preview(rule, min(count, 20))
        return Response({'upcoming': [d.isoformat() for d in dates]})

    @action(detail=False, methods=['post'])
    def run_due(self, request):
        """Process all due recurring rules (idempotent, prevents duplicates)."""
        summary = run_due_rules()
        return Response(summary)
