"""
Goal API views for WealthWise.
Handles financial savings goals with progress tracking.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from ..models import Goal
from ..serializers import GoalSerializer
from ..base import StandardResultsSetPagination, IsOwner


class GoalViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing financial goals.
    
    Goal categories:
    - Emergency: Emergency fund
    - Travel: Vacation/trip savings
    - Technology: Gadgets, equipment
    - Transportation: Vehicle purchase
    - Education: School, courses
    - Investment: Investment goals
    - Other: Miscellaneous goals
    
    Priorities: high, medium, low
    Status: active, completed, paused
    
    Auto-completes when current_amount >= target_amount.
    """
    serializer_class = GoalSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'priority', 'status']
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """Return goals for current user, ordered by creation date."""
        return Goal.objects.filter(
            user=self.request.user
        ).order_by('-created_at')

    def perform_create(self, serializer):
        """Create goal with current user as owner."""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def contribute(self, request, pk=None):
        """
        Add contribution to a goal.
        
        Request body:
            amount: Amount to add (positive) or remove (negative)
            
        Returns:
            Updated goal with new current_amount and percentage_complete.
        """
        goal = self.get_object()
        amount = request.data.get('amount', 0)
        
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid amount. Must be a number.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        goal.current_amount += amount
        
        # Auto-complete if target reached
        if goal.current_amount >= goal.target_amount and goal.status != 'completed':
            goal.status = 'completed'
            goal.completed_at = timezone.now()
        
        goal.save()
        
        serializer = self.get_serializer(goal)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """
        Toggle goal between active and paused status.
        
        Returns:
            Updated goal with new status.
        """
        goal = self.get_object()
        
        if goal.status == 'active':
            goal.status = 'paused'
        elif goal.status == 'paused':
            goal.status = 'active'
        else:
            return Response(
                {'error': 'Cannot change status of completed goals.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        goal.save(update_fields=['status'])
        
        serializer = self.get_serializer(goal)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def progress(self, request):
        """
        Get overall goals progress summary.
        
        Returns:
            total_goals: Number of goals
            active_goals: Number of active goals
            completed_goals: Number of completed goals
            total_target: Sum of all target amounts
            total_saved: Sum of all current amounts
            overall_percentage: Overall progress percentage
        """
        goals = self.get_queryset()
        
        active_goals = goals.filter(status='active')
        completed_goals = goals.filter(status='completed')
        
        total_target = sum(g.target_amount for g in goals)
        total_saved = sum(g.current_amount for g in goals)
        
        overall_percentage = 0
        if total_target > 0:
            overall_percentage = (total_saved / total_target) * 100
        
        return Response({
            'total_goals': goals.count(),
            'active_goals': active_goals.count(),
            'completed_goals': completed_goals.count(),
            'paused_goals': goals.filter(status='paused').count(),
            'total_target': float(total_target),
            'total_saved': float(total_saved),
            'total_remaining': float(total_target - total_saved),
            'overall_percentage': round(overall_percentage, 2)
        })
