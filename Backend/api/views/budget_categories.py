"""
Budget Category API views for WealthWise.
Handles budget allocation and spending tracking per category.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from decimal import Decimal

from ..models import BudgetCategory, Transaction, Category
from ..serializers import BudgetCategorySerializer
from ..base import StandardResultsSetPagination, IsOwner


class BudgetCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing budget categories.
    
    Tracks:
    - budgeted: Allocated amount for the category
    - spent: Amount spent (auto-calculated from transactions)
    - remaining: budgeted - spent
    - percentage_used: (spent / budgeted) * 100
    
    Includes color and icon for UI display.
    Links to universal Category model for shared categorization.
    """
    serializer_class = BudgetCategorySerializer
    permission_classes = [IsAuthenticated, IsOwner]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """Return budget categories for current user with properly synced spent values."""
        queryset = BudgetCategory.objects.filter(user=self.request.user)
        
        for category in queryset:
            if category.category:
                total_spent = Transaction.objects.filter(
                    user=self.request.user,
                    category=category.category,
                    type='expense'
                ).aggregate(total=Sum('amount'))['total']
            else:
                total_spent = Transaction.objects.filter(
                    user=self.request.user,
                    category__name=category.name,
                    type='expense'
                ).aggregate(total=Sum('amount'))['total']
            
            spent = total_spent or Decimal('0')
            if category.spent != spent:
                category.spent = spent
                category.save(update_fields=['spent'])
        
        return queryset

    def perform_create(self, serializer):
        """Create budget category with current user as owner. Auto-create Category if needed."""
        category_instance = serializer.validated_data.get('category')
        name = serializer.validated_data.get('name')
        
        if not category_instance:
            # Try to find existing category by name first, then create if not found
            category_instance, _ = Category.objects.get_or_create(
                user=self.request.user,
                name=name,
                type='expense',
                defaults={
                    'color': '#3b82f6',
                    'text_color': '#ffffff',
                    'icon': 'utensils',
                    'symbol': 'utensils',
                    'is_default': False,
                }
            )
        
        try:
            existing = BudgetCategory.objects.get(user=self.request.user, name=name)
            existing.category = category_instance
            for attr, value in serializer.validated_data.items():
                if attr != 'category':
                    setattr(existing, attr, value)
            existing.save()
            serializer.instance = existing
        except BudgetCategory.DoesNotExist:
            serializer.save(user=self.request.user, category=category_instance)

    @action(detail=True, methods=['post'])
    def update_spent(self, request, pk=None):
        """
        Recalculate spent amount from transactions.
        
        Args:
            pk: Budget category UUID
            
        Returns:
            Updated category with recalculated spent amount.
        """
        category = self.get_object()
        
        # Try to match by FK first, then by name
        if category.category:
            total_spent = Transaction.objects.filter(
                user=request.user,
                category=category.category,
                type='expense'
            ).aggregate(total=Sum('amount'))['total'] or 0
        else:
            total_spent = Transaction.objects.filter(
                user=request.user,
                category__name=category.name,
                type='expense'
            ).aggregate(total=Sum('amount'))['total'] or 0
        
        category.spent = Decimal('0') if total_spent == 0 else Decimal(str(total_spent))
        category.save(update_fields=['spent'])
        
        serializer = self.get_serializer(category)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """
        Get budget overview across all categories.
        
        Returns:
            total_budgeted: Sum of all budgeted amounts
            total_spent: Sum of all spent amounts
            total_remaining: Remaining budget
            overall_percentage: Overall budget usage percentage
            categories: List of categories with usage stats
        """
        categories = self.get_queryset()
        
        # Use updated spent values from get_queryset which already matched by FK
        total_budgeted = sum(c.budgeted for c in categories)
        total_spent = sum(c.spent for c in categories)
        
        categories_with_spent = [
            {
                'id': str(c.id),
                'name': c.name,
                'budgeted': float(c.budgeted),
                'spent': float(c.spent),
                'remaining': float(c.remaining),
                'percentage_used': round(float(c.percentage_used), 2) if c.budgeted > 0 else 0,
                'color': c.color,
                'text_color': c.text_color,
                'icon': c.icon,
                'symbol': c.symbol,
                'category': str(c.category.id) if c.category else None,
            }
            for c in categories
        ]
        
        overall_percentage = 0
        if total_budgeted > 0:
            overall_percentage = (total_spent / total_budgeted) * 100
        
        return Response({
            'total_budgeted': float(total_budgeted),
            'total_spent': float(total_spent),
            'total_remaining': float(total_budgeted - total_spent),
            'overall_percentage': round(overall_percentage, 2),
            'categories': categories_with_spent
        })
