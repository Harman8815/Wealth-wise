"""
Financial Health Score API views.

Exposes the project-scoped, explainable scoring engine: current snapshot,
history/timeline, per-dimension configuration (configurable weights), and
recommendations. All endpoints are scoped to the active project via
``project_scope_filter`` / ``request.active_project``.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.mixins import ListModelMixin
from django.db.models import Sum
from decimal import Decimal

from ..models import (
    FinancialHealthScore, ScoreDimensionConfig, HealthRecommendation,
    DIMENSION_KEYS, DIMENSION_LABELS, DEFAULT_DIMENSION_WEIGHTS,
)
from ..serializers import (
    FinancialHealthScoreSerializer, ScoreDimensionConfigSerializer,
    HealthRecommendationSerializer,
)
from ..base import StandardResultsSetPagination, IsOwner, project_scope_filter
from ..services.financial_health import recompute_for_project, resolve_weights


class FinancialHealthViewSet(viewsets.GenericViewSet):
    """Read endpoints + a recompute trigger for the financial health engine."""

    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def _scope(self, request):
        project = getattr(request, 'active_project', None)
        return project

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Return the latest computed score snapshot (or compute on demand)."""
        project = self._scope(request)
        snapshot = FinancialHealthScore.objects.filter(
            user=request.user, **project_scope_filter(request),
        ).order_by('-computed_at').first()
        if snapshot is None:
            snapshot = recompute_for_project(request.user, project, notify=False)
        serializer = FinancialHealthScoreSerializer(snapshot)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """Return the score timeline (most recent first), paginated."""
        project = self._scope(request)
        qs = FinancialHealthScore.objects.filter(
            user=request.user, **project_scope_filter(request),
        ).order_by('-computed_at')
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(
                FinancialHealthScoreSerializer(page, many=True).data
            )
        return Response(FinancialHealthScoreSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'])
    def report(self, request):
        """Detailed breakdown: current snapshot + dimensions + recommendations."""
        project = self._scope(request)
        snapshot = FinancialHealthScore.objects.filter(
            user=request.user, **project_scope_filter(request),
        ).order_by('-computed_at').first()
        if snapshot is None:
            snapshot = recompute_for_project(request.user, project, notify=False)

        recommendations = HealthRecommendation.objects.filter(
            user=request.user, **project_scope_filter(request),
            score_snapshot=snapshot,
        ).order_by('-estimated_improvement')

        total_uplift = recommendations.aggregate(
            s=Sum('estimated_improvement')
        )['s'] or Decimal('0')

        previous = FinancialHealthScore.objects.filter(
            user=request.user, **project_scope_filter(request),
        ).order_by('-computed_at')[1:2]
        previous_score = previous[0].score if previous else None

        return Response({
            'snapshot': FinancialHealthScoreSerializer(snapshot).data,
            'recommendations': HealthRecommendationSerializer(
                recommendations, many=True
            ).data,
            'estimated_improvement': float(total_uplift),
            'previous_score': float(previous_score) if previous_score is not None else None,
        })

    @action(detail=False, methods=['post'])
    def recompute(self, request):
        """Force a recomputation for the active project (event-driven trigger)."""
        project = self._scope(request)
        snapshot = recompute_for_project(request.user, project, notify=True)
        return Response(
            FinancialHealthScoreSerializer(snapshot).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get', 'put'])
    def config(self, request):
        """Get or update the configurable dimension weights/enabled flags."""
        project = self._scope(request)

        if request.method == 'PUT':
            weights = request.data.get('weights', {})
            for key, value in weights.items():
                if key not in DIMENSION_KEYS:
                    continue
                if isinstance(value, dict):
                    enabled = value.get('enabled', True)
                    weight = value.get('weight')
                else:
                    enabled = True
                    weight = value
                ScoreDimensionConfig.objects.update_or_create(
                    user=request.user,
                    project=project,
                    dimension=key,
                    defaults={
                        'weight': Decimal(str(weight)) if weight is not None else DEFAULT_DIMENSION_WEIGHTS[key],
                        'enabled': bool(enabled),
                    },
                )
            return Response(self._config_response(request.user, project))

        return Response(self._config_response(request.user, project))

    def _config_response(self, user, project):
        configs = {
            c.dimension: c for c in
            ScoreDimensionConfig.objects.filter(user=user, project=project)
        }
        dimensions = []
        for key in DIMENSION_KEYS:
            cfg = configs.get(key)
            dimensions.append({
                'dimension': key,
                'label': DIMENSION_LABELS[key],
                'weight': float(cfg.weight if cfg else DEFAULT_DIMENSION_WEIGHTS[key]),
                'enabled': cfg.enabled if cfg else True,
            })
        return {'dimensions': dimensions}
