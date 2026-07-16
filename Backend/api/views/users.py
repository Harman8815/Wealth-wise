"""
User API views for WealthWise.
Handles user registration, profile management, and current user info.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from ..models import User, Project, ProjectMember
from ..serializers import UserSerializer, UserCreateSerializer
from ..base import StandardResultsSetPagination


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user management.
    
    Provides endpoints for:
    - List all users (admin only in production)
    - Create new user (registration)
    - Retrieve user details
    - Update user profile
    - Delete user account
    - Get current user info via /users/me/
    """
    queryset = User.objects.all()
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        """Return appropriate permissions based on action."""
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Get current authenticated user's profile.
        
        Returns:
            UserSerializer data for the requesting user.
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    def perform_create(self, serializer):
        """Create user and set password properly.
        
        Also creates a default 'Personal Finance' project for the new user
        and makes them the owner of that project.
        """
        user = serializer.save()
        user.set_password(serializer.validated_data['password'])
        user.save()

        project = Project.objects.create(
            name="Personal Finance",
            description="Your default personal finance workspace.",
            currency=user.currency or "INR",
            icon="wallet",
            color="#3b82f6",
            initial_budget=0,
            created_by=user,
        )
        ProjectMember.objects.create(
            project=project,
            user=user,
            role="owner",
            invited_by=user,
        )

        return user
