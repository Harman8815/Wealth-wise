from rest_framework import serializers
from .models import User, Account, Transaction, TransactionHistory, BudgetCategory, Goal, Alert, AlertSetting, Expense, Category, ScheduledReport, Project, ProjectMember, ProjectInvitation


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'color', 'text_color', 'icon', 'symbol', 'is_default', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CategoryCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['name', 'type', 'color', 'text_color', 'icon', 'symbol']

    def validate_name(self, value):
        return value.strip()


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
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True)
    category_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Transaction
        fields = ['id', 'date', 'description', 'category', 'category_id', 'category_name', 'amount', 'type', 'status', 'account', 'account_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'account_name', 'created_at', 'updated_at']

    def validate(self, attrs):
        if not attrs.get('category') and not attrs.get('category_name'):
            raise serializers.ValidationError({'category': 'Either category_id or category_name is required.'})
        if attrs.get('category_name') and attrs.get('category'):
            raise serializers.ValidationError({'category': 'Provide either category_id or category_name, not both.'})
        return attrs


class TransactionHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionHistory
        fields = ['id', 'transaction', 'changed_at', 'field_name', 'old_value', 'new_value']
        read_only_fields = ['id', 'transaction', 'changed_at', 'field_name', 'old_value', 'new_value']


class BudgetCategorySerializer(serializers.ModelSerializer):
    remaining = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    percentage_used = serializers.FloatField(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True, required=False, allow_null=True)
    category_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = BudgetCategory
        fields = ['id', 'name', 'category', 'category_id', 'category_name', 'budgeted', 'spent', 'remaining', 'percentage_used', 'color', 'text_color', 'icon', 'symbol', 'created_at', 'updated_at']
        read_only_fields = ['id', 'spent', 'created_at', 'updated_at']

    def validate(self, attrs):
        if not attrs.get('category') and not attrs.get('category_name') and self.instance is None:
            raise serializers.ValidationError({'category': 'Either category_id or category_name is required.'})
        return attrs


class GoalSerializer(serializers.ModelSerializer):
    percentage_complete = serializers.FloatField(read_only=True)

    class Meta:
        model = Goal
        fields = ['id', 'title', 'description', 'target_amount', 'current_amount', 'target_date', 'category', 'priority', 'status', 'percentage_complete', 'completed_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'completed_at', 'created_at', 'updated_at']


class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ['id', 'type', 'title', 'message', 'category', 'priority', 'dismissed', 'project', 'timestamp', 'read', 'read_at', 'action_url', 'created_at']
        read_only_fields = ['id', 'created_at', 'read_at', 'dedup_key', 'project']


class AlertSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertSetting
        fields = ['id', 'setting_id', 'title', 'description', 'category', 'enabled', 'threshold', 'threshold_unit', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ExpenseSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True)
    category_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Expense
        fields = ['id', 'date', 'category', 'category_id', 'category_name', 'amount', 'note', 'receipt_url', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        if not attrs.get('category') and not attrs.get('category_name'):
            raise serializers.ValidationError({'category': 'Either category_id or category_name is required.'})
        if attrs.get('category_name') and attrs.get('category'):
            raise serializers.ValidationError({'category': 'Provide either category_id or category_name, not both.'})
        return attrs


class ScheduledReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledReport
        fields = ['id', 'name', 'report_type', 'frequency', 'enabled', 'last_run', 'next_run', 'created_at', 'updated_at']
        read_only_fields = ['id', 'last_run', 'created_at', 'updated_at']


# ---------------------------------------------------------------------------
# Projects / Account Management (multi-project architecture + RBAC)
# ---------------------------------------------------------------------------

class ProjectSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)
    user_role = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'currency', 'icon', 'color',
            'initial_budget', 'created_by', 'created_at', 'updated_at',
            'member_count', 'user_role',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'member_count', 'user_role']

    def get_user_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = obj.members.filter(user=request.user).first()
            return membership.role if membership else None
        return None


class ProjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'currency', 'icon', 'color', 'initial_budget']
        read_only_fields = ['id']

    def validate_name(self, value):
        return value.strip()


class ProjectMemberSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = ProjectMember
        fields = ['id', 'project', 'user', 'email', 'name', 'role', 'invited_by', 'joined_at']
        read_only_fields = ['id', 'project', 'user', 'email', 'name', 'invited_by', 'joined_at']


class AddProjectMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=ProjectMember.ROLE_CHOICES, default='editor')

    def validate_email(self, value):
        return value.strip().lower()


class UpdateProjectMemberSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=ProjectMember.ROLE_CHOICES)


class ProjectInvitationSerializer(serializers.ModelSerializer):
    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)

    class Meta:
        model = ProjectInvitation
        fields = [
            'id', 'project', 'email', 'role', 'invited_by', 'invited_by_email',
            'status', 'token', 'created_at', 'expires_at', 'accepted_at',
        ]
        read_only_fields = [
            'id', 'project', 'invited_by', 'invited_by_email',
            'status', 'token', 'created_at', 'expires_at', 'accepted_at',
        ]


class CreateProjectInvitationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=ProjectInvitation.ROLE_CHOICES, default='editor')

    def validate_email(self, value):
        return value.strip().lower()
