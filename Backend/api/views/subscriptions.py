"""
Subscription Detection API views.

Exposes the project-scoped, mined subscription feed:

* ``GET /api/subscriptions/`` — list detected subscriptions (non-ignored, newest first).
* ``POST /api/subscriptions/scan/`` — re-run pattern mining for the project.
* ``POST /api/subscriptions/{id}/confirm/`` — mark a subscription confirmed.
* ``POST /api/subscriptions/{id}/ignore/`` — ignore a subscription (suppress merchant).
* ``POST /api/subscriptions/{id}/convert/`` — promote into a ``RecurringRule``.

Mirrors ``InsightsViewSet`` / ``DuplicateViewSet``: project-scoped via
``project_scope_filter`` / ``request.active_project``.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..models import Subscription, Category, Account
from ..serializers import SubscriptionSerializer
from ..base import StandardResultsSetPagination, project_scope_filter
from ..services.subscriptions import (
    detect_for_project,
    confirm_subscription,
    ignore_subscription,
    convert_subscription,
)


class SubscriptionViewSet(viewsets.GenericViewSet):
    """Read + mine + act on detected subscriptions."""

    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    serializer_class = SubscriptionSerializer

    def _scope(self, request):
        return getattr(request, 'active_project', None)

    def get_queryset(self):
        return Subscription.objects.filter(
            user=self.request.user, **project_scope_filter(self.request),
        ).exclude(status__in=['ignored', 'converted']).order_by('-monthly_cost', '-last_seen')

    def list(self, request):
        """List detected (non-ignored) subscriptions for the active project."""
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(SubscriptionSerializer(page, many=True).data)
        return Response(SubscriptionSerializer(qs, many=True).data)

    @action(detail=False, methods=['post'])
    def scan(self, request):
        """Re-run pattern mining for the active project; return the detected list."""
        project = self._scope(request)
        detected = detect_for_project(request.user, project, notify=True)
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(SubscriptionSerializer(page, many=True).data)
        return Response(SubscriptionSerializer(qs, many=True).data)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Mark a detected subscription as confirmed by the user."""
        sub = self._get_owned(pk)
        if sub is None:
            return Response({'detail': 'Subscription not found.'}, status=status.HTTP_404_NOT_FOUND)
        confirm_subscription(sub)
        return Response(SubscriptionSerializer(sub).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def ignore(self, request, pk=None):
        """Ignore a detected subscription; suppress its merchant from future scans."""
        sub = self._get_owned(pk)
        if sub is None:
            return Response({'detail': 'Subscription not found.'}, status=status.HTTP_404_NOT_FOUND)
        ignore_subscription(sub)
        return Response(SubscriptionSerializer(sub).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        """Promote a detected subscription into a recurring rule."""
        sub = self._get_owned(pk)
        if sub is None:
            return Response({'detail': 'Subscription not found.'}, status=status.HTTP_404_NOT_FOUND)
        category = None
        account = None
        category_id = request.data.get('category_id')
        account_id = request.data.get('account_id')
        if category_id:
            try:
                category = Category.objects.get(
                    id=category_id, user=request.user,
                    **project_scope_filter(request),
                )
            except (Category.DoesNotExist, ValueError):
                pass
        if account_id:
            try:
                account = Account.objects.get(
                    id=account_id, user=request.user,
                    **project_scope_filter(request),
                )
            except (Account.DoesNotExist, ValueError):
                pass
        rule = convert_subscription(sub, category=category, account=account)
        return Response(
            {'subscription': SubscriptionSerializer(sub).data, 'rule_id': str(rule.id)},
            status=status.HTTP_201_CREATED,
        )

    def _get_owned(self, pk):
        try:
            return Subscription.objects.get(
                id=pk, user=self.request.user, **project_scope_filter(self.request),
            )
        except (Subscription.DoesNotExist, ValueError):
            return None
