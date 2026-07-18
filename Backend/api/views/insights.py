"""
Dynamic AI Insights API views.

Exposes the project-scoped, dismissible insight feed:

* ``GET /api/insights/`` — list non-dismissed insights (paginated, newest first).
* ``POST /api/insights/generate/`` — generate/refresh insights for the project.
* ``POST /api/insights/{id}/dismiss/`` — dismiss a single insight.

Mirrors ``FinancialHealthViewSet`` / ``DuplicateViewSet``: project-scoped via
``project_scope_filter`` / ``request.active_project``.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..models import Insight
from ..serializers import InsightSerializer
from ..base import StandardResultsSetPagination, project_scope_filter
from ..services.insights import (
    generate_for_project, dismiss_insight,
)


class InsightsViewSet(viewsets.GenericViewSet):
    """Read + refresh + dismiss the AI insights feed."""

    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    serializer_class = InsightSerializer

    def _scope(self, request):
        return getattr(request, 'active_project', None)

    def get_queryset(self):
        return Insight.objects.filter(
            user=self.request.user, **project_scope_filter(self.request),
        ).filter(dismissed=False).order_by('-generated_at')

    def list(self, request):
        """List non-dismissed insights for the active project (paginated)."""
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(InsightSerializer(page, many=True).data)
        return Response(InsightSerializer(qs, many=True).data)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate/refresh insights for the active project; return the list."""
        project = self._scope(request)
        generate_for_project(request.user, project, notify=True)
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(InsightSerializer(page, many=True).data)
        return Response(InsightSerializer(qs, many=True).data)

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss a single insight; it will no longer appear in the feed."""
        try:
            insight = Insight.objects.get(
                id=pk, user=request.user, **project_scope_filter(request),
            )
        except (Insight.DoesNotExist, ValueError):
            return Response(
                {'detail': 'Insight not found.'}, status=status.HTTP_404_NOT_FOUND,
            )
        dismiss_insight(insight)
        return Response(InsightSerializer(insight).data, status=status.HTTP_200_OK)
