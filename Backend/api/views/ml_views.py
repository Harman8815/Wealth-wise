"""
Machine Learning feature API views.

Exposes project-scoped ML inference endpoints:

* ``GET /api/ml/anomalies/`` — detect transaction anomalies using Isolation Forest.
* ``GET /api/ml/forecast/`` — spending forecast using Prophet and/or LSTM.
* ``GET /api/ml/clusters/`` — merchant clustering using KMeans.
* ``GET /api/ml/budget-forecast/`` — budget category forecast.
"""
import pandas as pd
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..models import Transaction, BudgetCategory
from ..serializers import TransactionSerializer, BudgetCategorySerializer
from ..base import project_scope_filter
from ..services.ml_services import (
    detect_anomalies,
    forecast_spending,
    cluster_merchants,
    forecast_budget,
)


class MLViewSet(viewsets.GenericViewSet):
    """Project-scoped ML inference endpoints."""

    permission_classes = [IsAuthenticated]

    def _scope(self, request):
        return getattr(request, 'active_project', None)

    def _get_transactions(self, request):
        project = self._scope(request)
        qs = Transaction.objects.filter(user=request.user, **project_scope_filter(request))
        values = qs.values('id', 'date', 'description', 'amount', 'type', 'merchant', 'category__name')
        df = pd.DataFrame(list(values))
        if not df.empty:
            df.rename(columns={'category__name': 'category_name'}, inplace=True)
        return df

    def _get_budget_categories(self, request):
        project = self._scope(request)
        qs = BudgetCategory.objects.filter(user=request.user, **project_scope_filter(request))
        values = qs.values('name', 'budgeted', 'spent', 'color')
        return pd.DataFrame(list(values))

    @action(detail=False, methods=['get'])
    def anomalies(self, request):
        """Detect transaction anomalies for the active project."""
        df = self._get_transactions(request)
        if df.empty:
            return Response({'detail': 'No transactions found.'}, status=status.HTTP_404_NOT_FOUND)
        anomalies = detect_anomalies(df)
        return Response({'count': len(anomalies), 'anomalies': anomalies}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def forecast(self, request):
        """Spending forecast for the active project."""
        df = self._get_transactions(request)
        if df.empty:
            return Response({'detail': 'No transactions found.'}, status=status.HTTP_404_NOT_FOUND)
        result = forecast_spending(df)
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def clusters(self, request):
        """Merchant clustering for the active project."""
        df = self._get_transactions(request)
        if df.empty:
            return Response({'detail': 'No transactions found.'}, status=status.HTTP_404_NOT_FOUND)
        result = cluster_merchants(df)
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def budget_forecast(self, request):
        """Budget category forecast for the active project."""
        tx_df = self._get_transactions(request)
        budget_df = self._get_budget_categories(request)
        result = forecast_budget(tx_df, budget_df)
        return Response({'forecasts': result}, status=status.HTTP_200_OK)
