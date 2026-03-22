from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Account, Transaction, BudgetCategory, Goal, Alert, AlertSetting, Expense


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'currency', 'is_active', 'created_at')
    list_filter = ('is_active', 'is_staff', 'currency', 'theme')
    search_fields = ('email', 'name')
    ordering = ('-created_at',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name', 'currency', 'language', 'theme')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'email_verified')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2'),
        }),
    )
    readonly_fields = ('created_at', 'updated_at', 'last_login')


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'type', 'balance', 'is_active', 'created_at')
    list_filter = ('type', 'is_active', 'currency')
    search_fields = ('name', 'user__email', 'bank_name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('description', 'user', 'category', 'type', 'amount', 'date', 'status')
    list_filter = ('type', 'status', 'category', 'date')
    search_fields = ('description', 'user__email', 'category')
    ordering = ('-date', '-created_at')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'date'


@admin.register(BudgetCategory)
class BudgetCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'budgeted', 'spent', 'remaining', 'percentage_used')
    list_filter = ('name',)
    search_fields = ('name', 'user__email')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'category', 'priority', 'status', 'current_amount', 'target_amount', 'target_date')
    list_filter = ('category', 'priority', 'status')
    search_fields = ('title', 'user__email', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'completed_at')
    date_hierarchy = 'target_date'


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'type', 'category', 'read', 'timestamp')
    list_filter = ('type', 'category', 'read')
    search_fields = ('title', 'message', 'user__email')
    ordering = ('-timestamp',)
    readonly_fields = ('created_at', 'read_at')
    date_hierarchy = 'timestamp'


@admin.register(AlertSetting)
class AlertSettingAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'category', 'enabled', 'threshold', 'threshold_unit')
    list_filter = ('category', 'enabled')
    search_fields = ('title', 'user__email', 'setting_id')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('note', 'user', 'category', 'amount', 'date')
    list_filter = ('category', 'date')
    search_fields = ('note', 'user__email')
    ordering = ('-date',)
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'date'
