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
from django.db.models import Case, When, Value, IntegerField

from ..models import Category
from ..serializers import CategorySerializer, CategoryCreateUpdateSerializer
from ..base import StandardResultsSetPagination, IsOwner, project_scope_filter


CATEGORY_ICON_KEYWORDS = {
    'food': 'utensils',
    'dining': 'utensils',
    'restaurant': 'utensils',
    'eat': 'utensils',
    'drink': 'coffee',
    'coffee': 'coffee',
    'transport': 'car',
    'car': 'car',
    'travel': 'plane',
    'taxi': 'car',
    'fuel': 'fuel',
    'petrol': 'fuel',
    'repair': 'car',
    'shopping': 'shopping-cart',
    'retail': 'shopping-cart',
    'store': 'shopping-cart',
    'buy': 'shopping-cart',
    'grocery': 'shopping-cart',
    'entertainment': 'film',
    'movie': 'film',
    'fun': 'film',
    'game': 'film',
    'home': 'home',
    'house': 'home',
    'rent': 'home',
    'maintenance': 'home',
    'health': 'heart-pulse',
    'medical': 'heart-pulse',
    'doctor': 'heart-pulse',
    'medicine': 'heart-pulse',
    'education': 'book',
    'book': 'book',
    'study': 'book',
    'school': 'book',
    'utility': 'zap',
    'utilities': 'zap',
    'bill': 'zap',
    'electricity': 'zap',
    'internet': 'wifi',
    'phone': 'phone',
    'mobile': 'phone',
    'work': 'briefcase',
    'office': 'briefcase',
    'job': 'briefcase',
    'savings': 'piggy-bank',
    'investment': 'piggy-bank',
    'fitness': 'dumbbell',
    'gym': 'dumbbell',
    'music': 'music',
    'gift': 'gift',
}


def get_icon_for_category_name(name: str) -> tuple[str, str]:
    normalized = name.lower().strip()
    for keyword, symbol in CATEGORY_ICON_KEYWORDS.items():
        if keyword in normalized:
            return symbol, symbol
    return 'utensils', 'utensils'


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
        """Return categories for current user (and active project) plus global defaults."""
        return Category.objects.filter(
            user=self.request.user, **project_scope_filter(self.request)
        ).order_by('type', 'name')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CategoryCreateUpdateSerializer
        return CategorySerializer

    def perform_create(self, serializer):
        """Create category with current user and auto-assign defaults."""
        user = self.request.user
        name = serializer.validated_data.get('name', '').strip()
        cat_type = serializer.validated_data.get('type', 'expense')
        
        existing = Category.objects.filter(user=user, project=self.request.active_project, name__iexact=name, type=cat_type).first()
        if existing:
            serializer.instance = existing
            return
        
        icon, symbol = get_icon_for_category_name(name)
        defaults = {
            'user': user,
            'project': self.request.active_project,
            'color': '#3b82f6',
            'text_color': '#ffffff',
            'icon': icon,
            'symbol': symbol,
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
            Matching categories with id and name, sorted with exact matches first.
        """
        query = request.query_params.get('q', '')
        category_type = request.query_params.get('type')
        
        queryset = Category.objects.filter(
            user=request.user, **project_scope_filter(request)
        )
        
        if category_type:
            queryset = queryset.filter(type=category_type)
        
        if query:
            queryset = queryset.annotate(
                exact_match=Case(
                    When(name__iexact=query, then=Value(0)),
                    default=Value(1),
                    output_field=IntegerField(),
                )
            ).filter(name__icontains=query).order_by('exact_match', 'name')[:20]
        else:
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
            project=getattr(request, 'active_project', None),
            is_default=True
        ).order_by('type', 'name')
        
        serializer = self.get_serializer(defaults, many=True)
        return Response(serializer.data)
