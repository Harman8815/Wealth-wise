import pytest
from decimal import Decimal
from django.urls import reverse

from api.models import Account
from api.tests.factories import AccountFactory, ProjectFactory, ProjectMemberFactory

pytestmark = [pytest.mark.django_db]



@pytest.mark.rbac
class TestAccountCRUD:
    def test_list_authenticated(self, auth_client):
        AccountFactory.create_batch(3, user=auth_client.user)
        response = auth_client.get(('/api/accounts/'))
        assert response.status_code == 200
        assert len(response.data['results']) == 3

    def test_list_unauthenticated(self, api_client):
        response = api_client.get(('/api/accounts/'))
        assert response.status_code == 401

    def test_create_account(self, project_client):
        response = project_client.post(('/api/accounts/'), {
            'name': 'Test Bank',
            'type': 'bank',
            'balance': 5000,
        })
        assert response.status_code == 201
        assert response.data['name'] == 'Test Bank'
        assert Account.objects.filter(id=response.data['id']).first().user == project_client.user

    def test_create_missing_name(self, project_client):
        response = project_client.post(('/api/accounts/'), {
            'type': 'bank',
        })
        assert response.status_code == 400
        assert 'name' in response.data

    def test_retrieve_own(self, auth_client):
        account = AccountFactory(user=auth_client.user)
        response = auth_client.get(f'/api/accounts/{account.id}/')
        assert response.status_code == 200
        assert response.data['id'] == str(account.id)

    def test_update_own(self, auth_client):
        account = AccountFactory(user=auth_client.user)
        response = auth_client.patch(f'/api/accounts/{account.id}/', {
            'name': 'Updated Account',
        })
        assert response.status_code == 200
        assert response.data['name'] == 'Updated Account'

    def test_delete_own(self, auth_client):
        account = AccountFactory(user=auth_client.user)
        response = auth_client.delete(f'/api/accounts/{account.id}/')
        assert response.status_code == 204

    def test_other_user_cannot_access(self, auth_client, other_user):
        account = AccountFactory(user=other_user)
        response = auth_client.get(f'/api/accounts/{account.id}/')
        assert response.status_code == 404

    def test_other_user_cannot_delete(self, auth_client, other_user):
        account = AccountFactory(user=other_user)
        response = auth_client.delete(f'/api/accounts/{account.id}/')
        assert response.status_code == 404


@pytest.mark.rbac
class TestAccountActions:
    def test_summary(self, project_client):
        AccountFactory.create_batch(2, user=project_client.user, project=project_client.project, balance=1000)
        AccountFactory.create_batch(1, user=project_client.user, project=project_client.project, balance=2000, type='credit_card')
        response = project_client.get('/api/accounts/summary/')
        assert response.status_code == 200
        assert response.data['account_count'] == 3
        assert float(response.data['total_balance']) == 4000.0

    def test_toggle_active(self, auth_client):
        account = AccountFactory(user=auth_client.user, is_active=True)
        response = auth_client.post(f'/api/accounts/{account.id}/toggle_active/')
        assert response.status_code == 200
        assert response.data['is_active'] is False

    def test_summary_unauthenticated(self, api_client):
        response = api_client.get('/api/accounts/summary/')
        assert response.status_code == 401


@pytest.mark.project_isolation
class TestAccountProjectIsolation:
    def test_no_header_shows_all_accounts(self, auth_client):
        AccountFactory(user=auth_client.user, name='Project A Account', project=None)
        AccountFactory(user=auth_client.user, name='Project B Account', project=None)
        response = auth_client.get(('/api/accounts/'))
        assert response.status_code == 200
        assert len(response.data['results']) >= 2

    def test_with_header_scopes_to_project(self, project_client):
        project = project_client.project
        AccountFactory(user=project_client.user, project=project, name='In Project')
        AccountFactory(user=project_client.user, project=None, name='No Project')
        response = project_client.get(('/api/accounts/'))
        assert response.status_code == 200
        ids = [item['id'] for item in response.data['results']]
        assert str(Account.objects.filter(project=project, user=project_client.user).first().id) in ids


@pytest.mark.pagination
class TestAccountPagination:
    def test_default_page_size(self, auth_client):
        AccountFactory.create_batch(25, user=auth_client.user)
        response = auth_client.get(('/api/accounts/'))
        assert response.status_code == 200
        assert len(response.data['results']) == 20

    def test_custom_page_size(self, auth_client):
        AccountFactory.create_batch(25, user=auth_client.user)
        response = auth_client.get('/api/accounts/?page_size=10')
        assert response.status_code == 200
        assert len(response.data['results']) == 10


@pytest.mark.validation
class TestAccountValidation:
    def test_invalid_type(self, project_client):
        response = project_client.post(('/api/accounts/'), {
            'name': 'Bad Type',
            'type': 'invalid_type',
            'balance': 1000,
        })
        assert response.status_code == 400

    def test_negative_balance_allowed(self, project_client):
        response = project_client.post(('/api/accounts/'), {
            'name': 'Credit Card',
            'type': 'credit_card',
            'balance': -5000,
        })
        assert response.status_code == 201
