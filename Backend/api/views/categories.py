"""
Category API views for WealthWise.
Manages shared category system across the application.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Category
from ..serializers import CategorySerializer, CategoryCreateUpdateSerializer
from ..base import StandardResultsSetPagination, IsOwner


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing shared categories.
    
    Categories are user-specific and shared across:
    - Transactions
    - Expenses
    - Budget allocations
    - Goals
    
    Supports type-based filtering (expense, income, budget, goal).
    """
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type', 'is_default']
    search_fields = ['name']
    ordering_fields = ['name', 'type', 'created_at', 'updated_at']
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """Return categories for current user plus global defaults."""
        return Category.objects.filter(
            user=self.request.user
        ).order_by('type', 'name')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CategoryCreateUpdateSerializer
        return CategorySerializer

    def perform_create(self, serializer):
        """Create category with current user and auto-assign defaults."""
        defaults = {
            'user': self.request.user,
            'color': '#3b82f6',
            'text_color': '#ffffff',
            'icon': 'utensils',
            'symbol': 'utensils',
            'is_default': False,
        }
        serializer.save(**defaults)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search categories by name for autocomplete.
        
        Query params:
            q: Search query string
            type: Optional category type filter
            
        Returns:
            Matching categories with id and name.
        """
        query = request.query_params.get('q', '')
        category_type = request.query_params.get('type')
        
        queryset = Category.objects.filter(user=request.user)
        
        if category_type:
            queryset = queryset.filter(type=category_type)
        
        if query:
            queryset = queryset.filter(name__icontains=query)
        
        queryset = queryset.order_by('name')[:20]
        
        return Response([
            {
                'id': str(c.id),
                'name': c.name,
                'type': c.type,
                'color': c.color,
                'text_color': c.text_color,
                'icon': c.icon,
                'symbol': c.symbol,
            }
            for c in queryset
        ])

    @action(detail=False, methods=['get'])
    def defaults(self, request):
        """
        Get default system categories.
        
        Returns:
            List of default categories that can be used as templates.
        """
        defaults = Category.objects.filter(
            user=request.user,
            is_default=True
        ).order_by('type', 'name')
        
        serializer = self.get_serializer(defaults, many=True)
        return Response(serializer.data)
