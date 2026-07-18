"""
Recurring Budgets API views for WealthWise.

Exposes CRUD for ``RecurringBudget`` plus lifecycle actions (pause/resume,
trigger an immediate generation, list executions, preview upcoming dates, and a
global "process due budgets" endpoint). Generation logic lives in
``services.recurring_budgets`` so the scheduling engine stays UI-independent and
reuses the same recurrence engine as recurring transactions.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from ..models import RecurringBudget, RecurringBudgetExecution
from ..serializers import RecurringBudgetSerializer, RecurringBudgetExecutionSerializer
from ..base import StandardResultsSetPagination, IsOwner, project_scope_filter
from ..services.recurring_budgets import (
    execute_rule,
    run_due_rules,
    recompute_next_generation,
    get_upcoming_preview,
)
from ..services.notifications import (
    notify_recurring_budget_paused,
    notify_recurring_budget_resumed,
    notify_recurring_budget_completed,
)


class RecurringBudgetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing recurring budget rules.

    Frequencies: daily, weekly, monthly, quarterly, yearly, custom.
    Status: active, paused, completed.

    Each rule stores a generic schedule plus a category-allocation template. The
    engine materialises concrete budgets when a period begins, so the same
    platform can later back seasonal, shared, or AI-recommended budgets.
    """

    serializer_class = RecurringBudgetSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'frequency', 'strategy']
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return RecurringBudget.objects.filter(
            user=self.request.user, **project_scope_filter(self.request)
        ).select_related('anchor_budget').order_by('-created_at')

    def perform_create(self, serializer):
        rule = serializer.save(user=self.request.user, project=self.request.active_project)
        recompute_next_generation(rule)
        from ..services.financial_health import recompute_after_change
        recompute_after_change(rule.user, rule.project)

    def perform_update(self, serializer):
        rule = serializer.save()
        recompute_next_generation(rule)
        from ..services.financial_health import recompute_after_change
        recompute_after_change(rule.user, rule.project)

    def perform_destroy(self, instance):
        user, project = instance.user, instance.project
        super().perform_destroy(instance)
        from ..services.financial_health import recompute_after_change
        recompute_after_change(user, project)

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
        notify_recurring_budget_paused(rule)
        from ..services.financial_health import recompute_after_change
        recompute_after_change(rule.user, rule.project)
        return Response(self.get_serializer(rule).data)

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume a paused rule."""
        rule = self.get_object()
        rule.status = 'active'
        rule.save(update_fields=['status', 'updated_at'])
        recompute_next_generation(rule)
        notify_recurring_budget_resumed(rule)
        from ..services.financial_health import recompute_after_change
        recompute_after_change(rule.user, rule.project)
        return Response(self.get_serializer(rule).data)

    @action(detail=True, methods=['post'])
    def generate_now(self, request, pk=None):
        """Immediately generate the budget (used for manual trigger)."""
        rule = self.get_object()
        if rule.status == 'completed':
            return Response(
                {'error': 'Cannot generate for a completed rule.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        as_of = timezone.localdate()
        execution = execute_rule(rule, as_of)
        from ..services.financial_health import recompute_after_change
        recompute_after_change(rule.user, rule.project)
        return Response(
            {
                'execution': RecurringBudgetExecutionSerializer(execution).data,
                'rule': self.get_serializer(rule).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['get'])
    def executions(self, request, pk=None):
        """List recorded generations for this rule."""
        rule = self.get_object()
        qs = RecurringBudgetExecution.objects.filter(rule=rule).order_by('-scheduled_date')
        page = self.paginate_queryset(qs)
        serializer = RecurringBudgetExecutionSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=['get'])
    def upcoming(self, request, pk=None):
        """Preview the next few scheduled generation dates."""
        rule = self.get_object()
        count = int(request.query_params.get('count', 5))
        dates = get_upcoming_preview(rule, min(count, 20))
        return Response({'upcoming': [d.isoformat() for d in dates]})

    @action(detail=False, methods=['post'])
    def run_due(self, request):
        """Process all due recurring-budget rules (idempotent, prevents duplicates)."""
        summary = run_due_rules()
        from ..services.financial_health import recompute_after_change
        recompute_after_change(request.user, getattr(request, 'active_project', None))
        return Response(summary)
