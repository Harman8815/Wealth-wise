"""
Transaction API views for WealthWise.
Handles income and expense transaction records with filtering and summaries.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Q

from ..models import Transaction
from ..serializers import TransactionSerializer
from ..base import StandardResultsSetPagination, IsOwner


class TransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing financial transactions.
    
    Transaction types:
    - income: Salary, investments, etc.
    - expense: Purchases, bills, etc.
    
    Filterable fields:
    - category: Food & Dining, Transportation, etc.
    - type: income, expense
    - status: completed, pending
    - date: Transaction date
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'type', 'status', 'date']
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """Return transactions for current user, ordered by date."""
        return Transaction.objects.filter(
            user=self.request.user
        ).order_by('-date', '-created_at')

    def perform_create(self, serializer):
        """Create transaction with current user as owner."""
        serializer.save(user=self.request.user)

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
        
        categories = queryset.values('category').annotate(
            total=Sum('amount'),
            count=Sum('id')
        ).order_by('-total')
        
        return Response([
            {
                'category': item['category'],
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
