from rest_framework import serializers
from .models import User, Account, Transaction, BudgetCategory, Goal, Alert, AlertSetting, Expense


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'currency', 'language', 'theme', 'email_verified', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'password', 'currency', 'language', 'theme']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'name', 'type', 'balance', 'currency', 'is_active', 'bank_name', 'account_number', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'date', 'description', 'category', 'amount', 'type', 'status', 'account', 'account_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'account_name', 'created_at', 'updated_at']


class BudgetCategorySerializer(serializers.ModelSerializer):
    remaining = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    percentage_used = serializers.FloatField(read_only=True)

    class Meta:
        model = BudgetCategory
        fields = ['id', 'name', 'budgeted', 'spent', 'remaining', 'percentage_used', 'color', 'icon', 'created_at', 'updated_at']
        read_only_fields = ['id', 'spent', 'created_at', 'updated_at']


class GoalSerializer(serializers.ModelSerializer):
    percentage_complete = serializers.FloatField(read_only=True)

    class Meta:
        model = Goal
        fields = ['id', 'title', 'description', 'target_amount', 'current_amount', 'target_date', 'category', 'priority', 'status', 'percentage_complete', 'completed_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'completed_at', 'created_at', 'updated_at']


class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ['id', 'type', 'title', 'message', 'category', 'timestamp', 'read', 'read_at', 'action_url', 'created_at']
        read_only_fields = ['id', 'created_at', 'read_at']


class AlertSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertSetting
        fields = ['id', 'setting_id', 'title', 'description', 'category', 'enabled', 'threshold', 'threshold_unit', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'date', 'category', 'amount', 'note', 'receipt_url', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
