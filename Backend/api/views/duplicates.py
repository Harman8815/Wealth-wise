"""
Duplicate Transaction Detection API views.

Exposes project-scoped review + resolution of detected duplicate transactions:

* ``GET /api/duplicates/`` — list open ``DuplicateGroup``s with their matches.
* ``POST /api/duplicates/scan/`` — trigger a standing scan for the active project.
* ``POST /api/duplicates/{match_id}/resolve/`` — apply kept/deleted/not_duplicate.
* ``POST /api/duplicates/feedback/`` — record an explicit duplicate label.

Mirrors the structure of ``FinancialHealthViewSet`` (GenericViewSet + actions,
project-scoped via ``project_scope_filter`` / ``request.active_project``).
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..models import DuplicateGroup, DuplicateMatch, DuplicateFeedback
from ..serializers import (
    DuplicateGroupSerializer, DuplicateMatchSerializer, DuplicateFeedbackSerializer,
)
from ..base import StandardResultsSetPagination, project_scope_filter
from ..services.duplicates import scan_for_project, resolve_match, record_feedback


class DuplicateViewSet(viewsets.GenericViewSet):
    """Review and resolve detected duplicate transactions."""

    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def _scope(self, request):
        return getattr(request, 'active_project', None)

    def get_queryset(self):
        return DuplicateGroup.objects.filter(
            user=self.request.user, **project_scope_filter(self.request),
        ).order_by('-detected_at')

    def list(self, request):
        """List open duplicate groups with their matches (paginated)."""
        qs = self.get_queryset().filter(status='open')
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(
                DuplicateGroupSerializer(page, many=True).data
            )
        return Response(DuplicateGroupSerializer(qs, many=True).data)

    @action(detail=False, methods=['post'])
    def scan(self, request):
        """Trigger a standing duplicate scan for the active project."""
        project = self._scope(request)
        try:
            groups = scan_for_project(request.user, project, persist=True, notify=True)
        except Exception as exc:  # pragma: no cover - defensive
            return Response(
                {'detail': f'Scan failed: {exc}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {
                'groups_found': len(groups),
                'groups': DuplicateGroupSerializer(groups, many=True).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path=r'matches/(?P<match_id>[^/.]+)/resolve')
    def resolve(self, request, pk=None, match_id=None):
        """Resolve a single match (kept / deleted / not_duplicate)."""
        try:
            match = DuplicateMatch.objects.get(
                id=match_id, user=request.user, **project_scope_filter(request),
            )
        except (DuplicateMatch.DoesNotExist, ValueError):
            return Response(
                {'detail': 'Match not found.'}, status=status.HTTP_404_NOT_FOUND,
            )
        resolution = request.data.get('resolution')
        try:
            resolve_match(match, resolution)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        # A 'deleted' resolution cascade-removes the match row with its
        # transaction, so there is nothing left to serialize.
        if resolution == 'deleted':
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(DuplicateMatchSerializer(match).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='feedback')
    def feedback(self, request):
        """Record an explicit duplicate / not_duplicate label for a pair."""
        transaction_a = request.data.get('transaction_a')
        transaction_b = request.data.get('transaction_b')
        label = request.data.get('label')
        if not transaction_a or not transaction_b or not label:
            return Response(
                {'detail': 'transaction_a, transaction_b and label are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            fb = record_feedback(
                request.user, self._scope(request), transaction_a, transaction_b, label,
            )
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DuplicateFeedbackSerializer(fb).data, status=status.HTTP_201_CREATED)
