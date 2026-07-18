import pytest
from decimal import Decimal
from django.urls import reverse
from datetime import date

from api.models import Transaction, Category
from api.tests.factories import TransactionFactory, CategoryFactory, AccountFactory

pytestmark = [pytest.mark.django_db]



@pytest.mark.rbac
class TestTransactionCRUD:
    def test_list_authenticated(self, auth_client):
        TransactionFactory.create_batch(3, user=auth_client.user)
        response = auth_client.get(('/api/transactions/'))
        assert response.status_code == 200
        assert len(response.data['results']) == 3

    def test_list_unauthenticated(self, api_client):
        response = api_client.get(('/api/transactions/'))
        assert response.status_code == 401

    def test_create_with_category_id(self, project_client):
        category = CategoryFactory(user=project_client.user, project=project_client.project)
        response = project_client.post(('/api/transactions/'), {
            'date': '2024-06-01',
            'description': 'Test transaction',
            'category_id': str(category.id),
            'amount': 5000,
            'type': 'expense',
            'status': 'completed',
        })
        assert response.status_code == 201
        assert response.data['amount'] == '5000.00'

    def test_create_with_category_name(self, project_client):
        response = project_client.post(('/api/transactions/'), {
            'date': '2024-06-01',
            'description': 'Test transaction',
            'category_name': 'Groceries',
            'amount': 5000,
            'type': 'expense',
            'status': 'completed',
        })
        assert response.status_code == 201
        assert response.data['category']['name'] == 'Groceries'

    def test_create_missing_category(self, project_client):
        response = project_client.post(('/api/transactions/'), {
            'date': '2024-06-01',
            'description': 'Test transaction',
            'amount': 5000,
            'type': 'expense',
            'status': 'completed',
        })
        assert response.status_code == 400
        assert 'category' in response.data or 'category_id' in response.data

    def test_create_both_category_id_and_name(self, project_client):
        category = CategoryFactory(user=project_client.user, project=project_client.project)
        response = project_client.post(('/api/transactions/'), {
            'date': '2024-06-01',
            'description': 'Test transaction',
            'category_id': str(category.id),
            'category_name': 'Groceries',
            'amount': 5000,
            'type': 'expense',
            'status': 'completed',
        })
        assert response.status_code == 400

    def test_retrieve_own(self, auth_client):
        txn = TransactionFactory(user=auth_client.user)
        response = auth_client.get(f'/api/transactions/{txn.id}/')
        assert response.status_code == 200
        assert response.data['id'] == str(txn.id)

    def test_update_own(self, auth_client):
        txn = TransactionFactory(user=auth_client.user)
        response = auth_client.patch(f'/api/transactions/{txn.id}/', {
            'description': 'Updated description',
        })
        assert response.status_code == 200
        assert response.data['description'] == 'Updated description'

    def test_delete_own(self, auth_client):
        txn = TransactionFactory(user=auth_client.user)
        response = auth_client.delete(f'/api/transactions/{txn.id}/')
        assert response.status_code == 204

    def test_other_user_cannot_access(self, auth_client, other_user):
        txn = TransactionFactory(user=other_user)
        response = auth_client.get(f'/api/transactions/{txn.id}/')
        assert response.status_code == 404


@pytest.mark.auth
class TestTransactionActions:
    def test_summary(self, project_client):
        TransactionFactory.create_batch(2, user=project_client.user, project=project_client.project, type='income', amount=1000)
        TransactionFactory.create_batch(1, user=project_client.user, project=project_client.project, type='expense', amount=500)
        response = project_client.get('/api/transactions/summary/')
        assert response.status_code == 200
        assert response.data['income'] == 2000.0
        assert response.data['expense'] == 500.0
        assert response.data['net'] == 1500.0

    def test_by_category(self, project_client):
        cat = CategoryFactory(user=project_client.user, project=project_client.project, name='Food')
        TransactionFactory.create_batch(3, user=project_client.user, project=project_client.project, type='expense', category=cat, amount=200)
        response = project_client.get('/api/transactions/by_category/')
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_monthly_stats(self, project_client):
        TransactionFactory.create_batch(2, user=project_client.user, project=project_client.project)
        response = project_client.get('/api/transactions/monthly_stats/')
        assert response.status_code == 200
        assert isinstance(response.data, list)

    def test_history(self, auth_client):
        txn = TransactionFactory(user=auth_client.user)
        response = auth_client.get(f'/api/transactions/{txn.id}/history/')
        assert response.status_code == 200
        assert isinstance(response.data, list)

    def test_summary_unauthenticated(self, api_client):
        response = api_client.get('/api/transactions/summary/')
        assert response.status_code == 401


@pytest.mark.project_isolation
class TestTransactionProjectIsolation:
    def test_no_header_shows_all(self, auth_client):
        TransactionFactory(user=auth_client.user, project=None)
        TransactionFactory(user=auth_client.user, project=None)
        response = auth_client.get(('/api/transactions/'))
        assert response.status_code == 200
        assert len(response.data['results']) >= 2

    def test_with_header_scopes_to_project(self, project_client):
        project = project_client.project
        TransactionFactory(user=project_client.user, project=project)
        TransactionFactory(user=project_client.user, project=None)
        response = project_client.get(('/api/transactions/'))
        assert response.status_code == 200
        ids = [item['id'] for item in response.data['results']]
        assert str(project.project_transactions.filter(user=project_client.user).first().id) in ids


@pytest.mark.pagination
class TestTransactionPagination:
    def test_default_page_size(self, auth_client):
        TransactionFactory.create_batch(25, user=auth_client.user)
        response = auth_client.get(('/api/transactions/'))
        assert response.status_code == 200
        assert len(response.data['results']) == 20

    def test_custom_page_size(self, auth_client):
        TransactionFactory.create_batch(25, user=auth_client.user)
        response = auth_client.get('/api/transactions/?page_size=10')
        assert response.status_code == 200
        assert len(response.data['results']) == 10


@pytest.mark.filtering
class TestTransactionFiltering:
    def test_filter_by_type(self, project_client):
        TransactionFactory(user=project_client.user, project=project_client.project, type='income')
        TransactionFactory(user=project_client.user, project=project_client.project, type='expense')
        response = project_client.get('/api/transactions/?type=income')
        assert response.status_code == 200
        for item in response.data['results']:
            assert item['type'] == 'income'

    def test_filter_by_status(self, project_client):
        TransactionFactory(user=project_client.user, project=project_client.project, status='completed')
        TransactionFactory(user=project_client.user, project=project_client.project, status='pending')
        response = project_client.get('/api/transactions/?status=pending')
        assert response.status_code == 200
        for item in response.data['results']:
            assert item['status'] == 'pending'

    def test_search_description(self, project_client):
        TransactionFactory(user=project_client.user, project=project_client.project, description='Unique grocery purchase')
        response = project_client.get('/api/transactions/?search=grocery')
        assert response.status_code == 200
        assert len(response.data['results']) >= 1


@pytest.mark.validation
class TestTransactionValidation:
    def test_invalid_type(self, project_client):
        response = project_client.post(('/api/transactions/'), {
            'date': '2024-06-01',
            'description': 'Bad type',
            'amount': 1000,
            'type': 'invalid_type',
        })
        assert response.status_code == 400

    def test_invalid_status(self, project_client):
        response = project_client.post(('/api/transactions/'), {
            'date': '2024-06-01',
            'description': 'Bad status',
            'amount': 1000,
            'type': 'expense',
            'status': 'invalid_status',
        })
        assert response.status_code == 400
