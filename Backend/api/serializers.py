from rest_framework import serializers
from .models import User, Account, Transaction, TransactionHistory, BudgetCategory, Goal, Alert, AlertSetting, Expense, Category, ScheduledReport, Project, ProjectMember, ProjectInvitation, RecurringRule, RecurringExecution, RecurringBudget, RecurringBudgetExecution, ScoreDimensionConfig, FinancialHealthScore, HealthRecommendation, DuplicateGroup, DuplicateMatch, DuplicateFeedback, Insight


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
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True, required=False, allow_null=True)
    category_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Transaction
        fields = ['id', 'date', 'description', 'category', 'category_id', 'category_name', 'amount', 'type', 'status', 'account', 'account_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'account_name', 'created_at', 'updated_at']

    def validate(self, attrs):
        if self.instance is None:
            if not attrs.get('category') and not attrs.get('category_name'):
                raise serializers.ValidationError({'category': 'Either category_id or category_name is required.'})
            if attrs.get('category_name') and attrs.get('category'):
                raise serializers.ValidationError({'category': 'Provide either category_id or category_name, not both.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('category_name', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('category_name', None)
        return super().update(instance, validated_data)


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
        if not attrs.get('category') and not attrs.get('category_name') and not attrs.get('name') and self.instance is None:
            raise serializers.ValidationError({'category': 'Either category_id, category_name, or name is required.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('category_name', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('category_name', None)
        return super().update(instance, validated_data)


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
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True, required=False, allow_null=True)
    category_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Expense
        fields = ['id', 'date', 'category', 'category_id', 'category_name', 'amount', 'note', 'receipt_url', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        if self.instance is None:
            if not attrs.get('category') and not attrs.get('category_name'):
                raise serializers.ValidationError({'category': 'Either category_id or category_name is required.'})
            if attrs.get('category_name') and attrs.get('category'):
                raise serializers.ValidationError({'category': 'Provide either category_id or category_name, not both.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('category_name', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('category_name', None)
        return super().update(instance, validated_data)


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


# ---------------------------------------------------------------------------
# Recurring Transactions (reusable scheduling platform)
# ---------------------------------------------------------------------------

class RecurringRuleSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category',
        write_only=True, required=False, allow_null=True,
    )
    category_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    account = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.all(), write_only=True, required=False, allow_null=True,
    )
    account_name = serializers.CharField(read_only=True)

    class Meta:
        model = RecurringRule
        fields = [
            'id', 'name', 'description', 'amount', 'type', 'category', 'category_id',
            'category_name', 'account', 'account_name', 'status',
            'frequency', 'interval', 'weekdays', 'day_of_month', 'last_day_of_month',
            'start_date', 'end_date', 'never_ends',
            'next_execution_date', 'last_execution_date', 'execution_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'account_name', 'next_execution_date',
            'last_execution_date', 'execution_count', 'created_at', 'updated_at',
        ]

    def validate(self, attrs):
        if not attrs.get('category') and not attrs.get('category_name'):
            raise serializers.ValidationError(
                {'category': 'Either category_id or category_name is required.'}
            )
        if attrs.get('category_name') and attrs.get('category'):
            raise serializers.ValidationError(
                {'category': 'Provide either category_id or category_name, not both.'}
            )
        weekdays = attrs.get('weekdays')
        if weekdays is not None and not isinstance(weekdays, list):
            raise serializers.ValidationError({'weekdays': 'Must be a list of integers.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('category_name', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('category_name', None)
        return super().update(instance, validated_data)

    def validate_interval(self, value):
        if value is not None and value < 1:
            raise serializers.ValidationError('Interval must be at least 1.')
        return value


class RecurringExecutionSerializer(serializers.ModelSerializer):
    rule_name = serializers.CharField(source='rule.name', read_only=True)
    transaction = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = RecurringExecution
        fields = [
            'id', 'rule', 'rule_name', 'transaction', 'scheduled_date',
            'executed_at', 'status', 'error', 'created_at',
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Recurring Budgets (reusable budget generation platform)
# ---------------------------------------------------------------------------

class RecurringBudgetSerializer(serializers.ModelSerializer):
    anchor_budget_name = serializers.CharField(source='anchor_budget.name', read_only=True)

    class Meta:
        model = RecurringBudget
        fields = [
            'id', 'name', 'description', 'total_budget', 'categories',
            'strategy', 'adjustment_percent', 'auto_carry_forward',
            'auto_adjust_previous', 'status',
            'frequency', 'interval', 'weekdays', 'day_of_month', 'last_day_of_month',
            'start_date', 'end_date', 'never_ends',
            'next_generation_date', 'last_generation_date',
            'generation_count', 'anchor_budget', 'anchor_budget_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'next_generation_date', 'last_generation_date',
            'generation_count', 'anchor_budget_name', 'created_at', 'updated_at',
        ]

    def validate_categories(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('Categories must be a list.')
        for item in value:
            if not isinstance(item, dict) or 'name' not in item or 'budgeted' not in item:
                raise serializers.ValidationError(
                    'Each category must include a name and a budgeted amount.'
                )
        return value

    def validate_interval(self, value):
        if value is not None and value < 1:
            raise serializers.ValidationError('Interval must be at least 1.')
        return value

    def validate_adjustment_percent(self, value):
        if value is not None and (value < -100 or value > 1000):
            raise serializers.ValidationError('Adjustment percentage is out of range.')
        return value


class RecurringBudgetExecutionSerializer(serializers.ModelSerializer):
    rule_name = serializers.CharField(source='rule.name', read_only=True)

    class Meta:
        model = RecurringBudgetExecution
        fields = [
            'id', 'rule', 'rule_name', 'generated_budgets', 'scheduled_date',
            'executed_at', 'status', 'error', 'created_at',
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Financial Health Score Engine
# ---------------------------------------------------------------------------

class ScoreDimensionConfigSerializer(serializers.ModelSerializer):
    label = serializers.CharField(source='get_dimension_display', read_only=True)

    class Meta:
        model = ScoreDimensionConfig
        fields = [
            'id', 'dimension', 'label', 'weight', 'enabled',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class HealthRecommendationSerializer(serializers.ModelSerializer):
    label = serializers.CharField(source='get_dimension_display', read_only=True)

    class Meta:
        model = HealthRecommendation
        fields = [
            'id', 'dimension', 'label', 'title', 'detail',
            'estimated_improvement', 'priority', 'resolved', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class FinancialHealthScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialHealthScore
        fields = [
            'id', 'score', 'grade', 'grade_label', 'previous_score', 'trend',
            'dimensions', 'strengths', 'risks',
            'period_start', 'period_end', 'computed_at', 'created_at',
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Duplicate Transaction Detection
# ---------------------------------------------------------------------------

class DuplicateMatchSerializer(serializers.ModelSerializer):
    transaction_id = serializers.UUIDField(source='transaction.id', read_only=True)
    transaction_description = serializers.CharField(source='transaction.description', read_only=True)
    transaction_date = serializers.DateField(source='transaction.date', read_only=True)
    transaction_amount = serializers.DecimalField(
        source='transaction.amount', max_digits=12, decimal_places=2, read_only=True,
    )
    duplicate_of_id = serializers.UUIDField(source='duplicate_of.id', read_only=True)
    duplicate_of_description = serializers.CharField(source='duplicate_of.description', read_only=True)
    duplicate_of_date = serializers.DateField(source='duplicate_of.date', read_only=True)
    duplicate_of_amount = serializers.DecimalField(
        source='duplicate_of.amount', max_digits=12, decimal_places=2, read_only=True,
    )

    class Meta:
        model = DuplicateMatch
        fields = [
            'id', 'transaction_id', 'transaction_description', 'transaction_date',
            'transaction_amount', 'duplicate_of_id', 'duplicate_of_description',
            'duplicate_of_date', 'duplicate_of_amount', 'score', 'confidence',
            'features', 'explanation', 'resolution', 'created_at',
        ]
        read_only_fields = fields


class DuplicateGroupSerializer(serializers.ModelSerializer):
    matches = DuplicateMatchSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = DuplicateGroup
        fields = [
            'id', 'status', 'detected_at', 'member_count', 'matches',
        ]
        read_only_fields = fields

    def get_member_count(self, obj):
        ids = set()
        for m in obj.matches.all():
            ids.add(str(m.transaction_id))
            if m.duplicate_of_id:
                ids.add(str(m.duplicate_of_id))
        return len(ids)


class DuplicateFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = DuplicateFeedback
        fields = [
            'id', 'transaction_a', 'transaction_b', 'label', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


# ---------------------------------------------------------------------------
# Dynamic AI Insights
# ---------------------------------------------------------------------------

class InsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insight
        fields = [
            'id', 'kind', 'title', 'description', 'severity',
            'metadata', 'action_url', 'dismissed', 'generated_at',
        ]
        read_only_fields = fields
