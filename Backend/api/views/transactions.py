"""
Transaction API views for WealthWise.
Handles income and expense transaction records with filtering and summaries.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q

from ..models import Transaction, TransactionHistory, Category
from ..serializers import TransactionSerializer, TransactionHistorySerializer
from ..base import StandardResultsSetPagination, IsOwner, project_scope_filter

class TransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing financial transactions.
    
    Transaction types:
    - income: Salary, investments, etc.
    - expense: Purchases, bills, etc.
    
    Filterable fields:
    - category: Category ID or name (if auto-created)
    - type: income, expense
    - status: completed, pending
    - date: Transaction date
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'type', 'status', 'date']
    search_fields = ['description', 'category__name', 'account__name', 'status']
    ordering_fields = ['date', 'amount', 'category__name', 'created_at']
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """Return transactions for current user (and active project), ordered by date."""
        return Transaction.objects.filter(
            user=self.request.user, **project_scope_filter(self.request)
        ).select_related('category').order_by('-date', '-created_at')

    def perform_create(self, serializer):
        """Create transaction with current user as owner.
        Auto-create category if category name is provided as string.
        """
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
                    }
                )
        instance = serializer.save(user=self.request.user, project=self.request.active_project, category=category)
        from ..services.financial_health import recompute_after_change
        recompute_after_change(instance.user, instance.project)

    def perform_destroy(self, instance):
        project = instance.project
        user = instance.user
        super().perform_destroy(instance)
        from ..services.financial_health import recompute_after_change
        recompute_after_change(user, project)

    def perform_update(self, serializer):
        """Update transaction and track changes in history."""
        transaction = serializer.instance
        user = self.request.user

        # Track changes before saving
        old_values = {}
        for field in ['date', 'description', 'category', 'amount', 'type', 'status']:
            old_values[field] = getattr(transaction, field)

        super().perform_update(serializer)

        from ..services.financial_health import recompute_after_change
        recompute_after_change(transaction.user, transaction.project)

        # Create history records for changed fields
        for field in old_values:
            new_value = getattr(transaction, field)
            old_value = old_values[field]
            if field == 'category':
                old_value = str(old_value.id) if old_value else None
                new_value = str(new_value.id) if new_value else None
            if str(old_value) != str(new_value):
                TransactionHistory.objects.create(
                    transaction=transaction,
                    user=user,
                    changed_by=user,
                    field_name=field,
                    old_value=str(old_value),
                    new_value=str(new_value)
                )

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get transaction summary (income, expenses, net).
        
        Query params:
            start_date: Filter from date (YYYY-MM-DD)
            end_date: Filter to date (YYYY-MM-DD)
            
        Returns:
            income: Total income amount
            expense: Total expense amount
            net: Net amount (income - expense)
            transaction_count: Number of transactions
        """
        queryset = self.get_queryset()
        
        # Apply date filters if provided
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Calculate totals
        income = queryset.filter(type='income').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        expense = queryset.filter(type='expense').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        return Response({
            'income': float(income),
            'expense': float(expense),
            'net': float(income - expense),
            'transaction_count': queryset.count()
        })

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """
        Get expense breakdown by category.

        Returns:
            List of categories with total amounts.
        """
        queryset = self.get_queryset().filter(type='expense')

        categories = queryset.values('category__name').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')

        return Response([
            {
                'category': item['category__name'] or 'Uncategorized',
                'total': float(item['total']),
                'count': item['count']
            }
            for item in categories
        ])

    @action(detail=False, methods=['get'])
    def monthly_stats(self, request):
        """
        Get monthly income/expense statistics.
        
        Query params:
            months: Number of months to include (default: 12)
            
        Returns:
            Monthly breakdown with income and expense totals.
        """
        from django.db.models.functions import TruncMonth
        
        months = int(request.query_params.get('months', 12))
        queryset = self.get_queryset()
        
        monthly_data = queryset.annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            income=Sum('amount', filter=Q(type='income')),
            expense=Sum('amount', filter=Q(type='expense'))
        ).order_by('month')[:months]
        
        return Response([
            {
                'month': item['month'].strftime('%Y-%m') if item['month'] else None,
                'income': float(item['income'] or 0),
                'expense': float(item['expense'] or 0),
                'net': float((item['income'] or 0) - (item['expense'] or 0))
            }
            for item in monthly_data
        ])

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """
        Get edit history for a specific transaction.
        
        Returns:
            List of changes made to the transaction.
        """
        transaction = self.get_object()
        history = TransactionHistory.objects.filter(transaction=transaction).order_by('-changed_at')
        return Response([
            {
                'id': str(h.id),
                'changed_at': h.changed_at,
                'field_name': h.field_name,
                'old_value': h.old_value,
                'new_value': h.new_value
            }
            for h in history
        ])
