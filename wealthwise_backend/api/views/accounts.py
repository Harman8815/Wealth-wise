"""
Account API views for WealthWise.
Handles financial account management (bank accounts, cards, wallets, cash).
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum

from ..models import Account
from ..serializers import AccountSerializer
from ..base import StandardResultsSetPagination, IsOwner


class AccountViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing financial accounts.
    
    Supports account types:
    - bank: Bank accounts (savings, current)
    - credit_card: Credit cards
    - debit_card: Debit cards
    - wallet: Digital wallets (Paytm, etc.)
    - cash: Cash holdings
    
    All endpoints require authentication. Users can only
    access their own accounts.
    """
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """Return accounts belonging to the current user."""
        return Account.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Create account with current user as owner."""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get account balance summary.
        
        Returns:
            total_balance: Sum of all account balances
            account_count: Number of accounts
            by_type: Breakdown by account type
        """
        accounts = self.get_queryset()
        
        total_balance = accounts.aggregate(
            total=Sum('balance')
        )['total'] or 0
        
        by_type = {}
        for acc in accounts:
            if acc.type not in by_type:
                by_type[acc.type] = {'count': 0, 'balance': 0}
            by_type[acc.type]['count'] += 1
            by_type[acc.type]['balance'] += float(acc.balance)
        
        return Response({
            'total_balance': float(total_balance),
            'account_count': accounts.count(),
            'by_type': by_type
        })

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """
        Toggle account active status.
        
        Args:
            pk: Account UUID
            
        Returns:
            Updated account data with new active status.
        """
        account = self.get_object()
        account.is_active = not account.is_active
        account.save(update_fields=['is_active'])
        
        serializer = self.get_serializer(account)
        return Response(serializer.data)
