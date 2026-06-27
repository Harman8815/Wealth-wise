"""
Budget Category API views for WealthWise.
Handles budget allocation and spending tracking per category.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum

from ..models import BudgetCategory, Transaction
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
    """
    serializer_class = BudgetCategorySerializer
    permission_classes = [IsAuthenticated, IsOwner]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """Return budget categories for current user."""
        return BudgetCategory.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Create budget category with current user as owner. Update if exists."""
        name = serializer.validated_data.get('name')
        try:
            existing = BudgetCategory.objects.get(user=self.request.user, name=name)
            # Update existing category
            for attr, value in serializer.validated_data.items():
                setattr(existing, attr, value)
            existing.save()
            serializer.instance = existing
        except BudgetCategory.DoesNotExist:
            serializer.save(user=self.request.user)

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
        
        total_spent = Transaction.objects.filter(
            user=request.user,
            category=category.name,
            type='expense'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        category.spent = total_spent
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
        
        total_budgeted = sum(c.budgeted for c in categories)
        
        # Calculate spent dynamically from transactions for each category
        categories_with_spent = []
        total_spent = 0
        
        for c in categories:
            spent = Transaction.objects.filter(
                user=request.user,
                category=c.name,
                type='expense'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            spent_float = float(spent)
            total_spent += spent_float
            
            categories_with_spent.append({
                'id': str(c.id),
                'name': c.name,
                'budgeted': float(c.budgeted),
                'spent': spent_float,
                'remaining': float(max(0, c.budgeted - spent)),
                'percentage_used': round((spent_float / float(c.budgeted)) * 100, 2) if c.budgeted > 0 else 0,
                'color': c.color,
                'icon': c.icon
            })
        
        total_remaining = total_budgeted - total_spent
        
        overall_percentage = 0
        if total_budgeted > 0:
            overall_percentage = (total_spent / total_budgeted) * 100
        
        return Response({
            'total_budgeted': float(total_budgeted),
            'total_spent': float(total_spent),
            'total_remaining': float(total_remaining),
            'overall_percentage': round(overall_percentage, 2),
            'categories': categories_with_spent
        })
