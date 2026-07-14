"""
Expense API views for WealthWise.
Handles quick expense tracking entries.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum

from ..models import Expense, Category
from ..serializers import ExpenseSerializer
from ..base import StandardResultsSetPagination, IsOwner, project_scope_filter


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing quick expense entries.
    
    Categories:
    - Shared across transactions and budget via Category model
    - Used for rapid expense logging without full transaction details.
    Can include receipt images via receipt_url.
    """
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'date']
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """Return expenses for current user (and active project), ordered by date."""
        return Expense.objects.filter(
            user=self.request.user, **project_scope_filter(self.request)
        ).select_related('category').order_by('-date')

    def perform_create(self, serializer):
        """Create expense with current user as owner.
        Auto-create category if category name is provided as string.
        """
        category = serializer.validated_data.get('category')
        if category is None:
            category_name = serializer.validated_data.get('category_name')
            if category_name:
                category, _ = Category.objects.get_or_create(
                    user=self.request.user,
                    name=category_name,
                    type='expense',
                    project=self.request.active_project,
                    defaults={
                        'color': '#3b82f6',
                        'text_color': '#ffffff',
                        'icon': 'utensils',
                        'symbol': 'utensils',
                        'is_default': False,
                    }
                )
        serializer.save(user=self.request.user, project=self.request.active_project)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get expense summary.
        
        Query params:
            start_date: Filter from date (YYYY-MM-DD)
            end_date: Filter to date (YYYY-MM-DD)
            
        Returns:
            total_amount: Sum of all expenses
            expense_count: Number of expenses
            by_category: Breakdown by category
        """
        queryset = self.get_queryset()
        
        # Apply date filters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        total = queryset.aggregate(total=Sum('amount'))['total'] or 0
        
        # Category breakdown
        by_category = queryset.values('category').annotate(
            total=Sum('amount'),
            count=Sum('id')
        ).order_by('-total')
        
        return Response({
            'total_amount': float(total),
            'expense_count': queryset.count(),
            'by_category': [
                {
                    'category': item['category'],
                    'total': float(item['total']),
                    'count': item['count']
                }
                for item in by_category
            ]
        })

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """
        Get recent expenses (last 30 days by default).
        
        Query params:
            days: Number of days to include (default: 30)
            limit: Maximum results to return (default: 10)
            
        Returns:
            List of recent expenses.
        """
        from datetime import timedelta
        from django.utils import timezone
        
        days = int(request.query_params.get('days', 30))
        limit = int(request.query_params.get('limit', 10))
        
        cutoff_date = timezone.now().date() - timedelta(days=days)
        expenses = self.get_queryset().filter(
            date__gte=cutoff_date
        )[:limit]
        
        serializer = self.get_serializer(expenses, many=True)
        return Response(serializer.data)
