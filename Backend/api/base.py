"""
Base API configuration for WealthWise API.
Contains pagination, permissions, and exception handling.
"""
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import BasePermission, IsAuthenticated, AllowAny
from rest_framework.exceptions import APIException
from rest_framework import status


class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination class for API responses."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class IsOwner(BasePermission):
    """
    Permission class that checks if the user owns the object.
    Assumes the object has a 'user' attribute.
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsOwnerOrReadOnly(BasePermission):
    """
    Permission class that allows read access to anyone,
    but write access only to the owner.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return obj.user == request.user


class NotFoundException(APIException):
    """Custom exception for not found errors."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Resource not found.'
    default_code = 'not_found'


class ValidationError(APIException):
    """Custom exception for validation errors."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Invalid input.'
    default_code = 'invalid'


class PermissionDenied(APIException):
    """Custom exception for permission errors."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    default_code = 'permission_denied'
