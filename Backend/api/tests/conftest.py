import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wealthwise_backend.settings')
import django
django.setup()
from django.conf import settings
settings.DEBUG = True

import pytest
import uuid
from datetime import date
from decimal import Decimal

from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import User, Project, ProjectMember, Category, Account, Transaction
from .factories import (
    UserFactory, ProjectFactory, ProjectMemberFactory, ProjectInvitationFactory,
    AccountFactory, CategoryFactory, TransactionFactory, BudgetCategoryFactory,
    GoalFactory, AlertFactory, AlertSettingFactory, ExpenseFactory,
    ScheduledReportFactory, RecurringRuleFactory, RecurringBudgetFactory,
    ImportJobFactory, ExportJobFactory, MappingTemplateFactory,
)


pytestmark = [pytest.mark.django_db]


@pytest.fixture(autouse=True, scope='session')
def _enable_debug():
    """Enable DEBUG so dev-only endpoints (e.g. quick-login) work under test."""
    from django.conf import settings
    settings.DEBUG = True
    yield


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user():
    return UserFactory()


@pytest.fixture
def other_user():
    user = UserFactory(email='other@wealthwise.test')
    user.set_password('testpass123')
    user.save()
    return user


@pytest.fixture
def password():
    return 'testpass123'


@pytest.fixture
def user_with_password(user, password):
    user.set_password(password)
    user.save()
    return user


@pytest.fixture
def project(user):
    project = ProjectFactory(created_by=user)
    ProjectMember.objects.create(user=user, project=project, role='owner', invited_by=user)
    return project


@pytest.fixture
def membership(user, project):
    return ProjectMemberFactory(user=user, project=project, role='owner')


@pytest.fixture
def auth_client(api_client, user_with_password, password):
    refresh = RefreshToken.for_user(user_with_password)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    api_client.user = user_with_password
    return api_client


@pytest.fixture
def project_client(api_client, user_with_password, project, password):
    refresh = RefreshToken.for_user(user_with_password)
    api_client.credentials(
        HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}',
        HTTP_X_PROJECT_ID=str(project.id),
    )
    api_client.user = user_with_password
    api_client.project = project
    return api_client


@pytest.fixture
def category(user, project):
    return CategoryFactory(user=user, project=project)


@pytest.fixture
def account(user, project):
    return AccountFactory(user=user, project=project)


@pytest.fixture
def transaction(user, project, category, account):
    return TransactionFactory(user=user, project=project, category=category, account=account)


@pytest.fixture
def budget_category(user, project, category):
    return BudgetCategoryFactory(user=user, project=project, category=category)


@pytest.fixture
def goal(user, project):
    return GoalFactory(user=user, project=project)


@pytest.fixture
def alert(user, project):
    return AlertFactory(user=user, project=project)


@pytest.fixture
def alert_setting(user, project):
    return AlertSettingFactory(user=user, project=project)


@pytest.fixture
def expense(user, project, category):
    return ExpenseFactory(user=user, project=project, category=category)


@pytest.fixture
def scheduled_report(user, project):
    return ScheduledReportFactory(user=user, project=project)


@pytest.fixture
def recurring_rule(user, project, category):
    return RecurringRuleFactory(user=user, project=project, category=category)


@pytest.fixture
def recurring_budget(user, project):
    return RecurringBudgetFactory(user=user, project=project)


@pytest.fixture
def import_job(user, project):
    return ImportJobFactory(user=user, project=project)


@pytest.fixture
def export_job(user, project):
    return ExportJobFactory(user=user, project=project)


@pytest.fixture
def mapping_template(user, project):
    return MappingTemplateFactory(user=user, project=project)


@pytest.fixture
def other_project(other_user):
    return ProjectFactory(created_by=other_user)


@pytest.fixture
def other_project_membership(other_user, other_project):
    return ProjectMemberFactory(user=other_user, project=other_project, role='owner')


@pytest.fixture
def invitation(user, project, other_user):
    return ProjectInvitationFactory(project=project, email=other_user.email, invited_by=user)
