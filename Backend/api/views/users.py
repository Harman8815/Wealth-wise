"""
User API views for WealthWise.
Handles user registration, profile management, and current user info.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from ..models import User
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
        """Create user and set password properly."""
        user = serializer.save()
        user.set_password(serializer.validated_data['password'])
        user.save()
        return user
