import pytest
from decimal import Decimal
from django.urls import reverse

from api.models import BudgetCategory, Transaction, Category
from api.tests.factories import BudgetCategoryFactory, TransactionFactory, CategoryFactory, ProjectFactory, ProjectMemberFactory

pytestmark = [pytest.mark.django_db]



@pytest.mark.rbac
class TestBudgetCategoryCRUD:
    def test_list_authenticated(self, auth_client):
        BudgetCategoryFactory.create_batch(3, user=auth_client.user)
        response = auth_client.get(('/api/budget-categories/'))
        assert response.status_code == 200
        assert len(response.data['results']) == 3

    def test_list_unauthenticated(self, api_client):
        response = api_client.get(('/api/budget-categories/'))
        assert response.status_code == 401

    def test_create_budget_category(self, project_client):
        response = project_client.post(('/api/budget-categories/'), {
            'name': 'Food Budget',
            'budgeted': 5000,
        })
        assert response.status_code == 201
        assert response.data['name'] == 'Food Budget'

    def test_retrieve_own(self, auth_client):
        bc = BudgetCategoryFactory(user=auth_client.user)
        response = auth_client.get(f'/api/budget-categories/{bc.id}/')
        assert response.status_code == 200

    def test_update_own(self, auth_client):
        bc = BudgetCategoryFactory(user=auth_client.user)
        response = auth_client.patch(f'/api/budget-categories/{bc.id}/', {
            'budgeted': 10000,
        })
        assert response.status_code == 200
        assert Decimal(response.data['budgeted']) == 10000

    def test_delete_own(self, auth_client):
        bc = BudgetCategoryFactory(user=auth_client.user)
        response = auth_client.delete(f'/api/budget-categories/{bc.id}/')
        assert response.status_code == 204

    def test_other_user_cannot_access(self, auth_client, other_user):
        bc = BudgetCategoryFactory(user=other_user)
        response = auth_client.get(f'/api/budget-categories/{bc.id}/')
        assert response.status_code == 404


@pytest.mark.rbac
class TestBudgetCategoryActions:
    def test_overview(self, project_client):
        cat_food = CategoryFactory(user=project_client.user, project=project_client.project, name='Food')
        cat_rent = CategoryFactory(user=project_client.user, project=project_client.project, name='Rent')
        BudgetCategoryFactory(user=project_client.user, project=project_client.project, name='Food', category=cat_food, budgeted=5000)
        BudgetCategoryFactory(user=project_client.user, project=project_client.project, name='Rent', category=cat_rent, budgeted=3000)
        TransactionFactory.create_batch(2, user=project_client.user, project=project_client.project, category=cat_food, type='expense', amount=1000)
        TransactionFactory.create_batch(3, user=project_client.user, project=project_client.project, category=cat_rent, type='expense', amount=1000)
        response = project_client.get('/api/budget-categories/overview/')
        assert response.status_code == 200
        assert response.data['total_budgeted'] == 8000.0
        assert response.data['total_spent'] == 5000.0

    def test_update_spent(self, project_client):
        cat = CategoryFactory(user=project_client.user, project=project_client.project)
        bc = BudgetCategoryFactory(user=project_client.user, project=project_client.project, category=cat)
        TransactionFactory(user=project_client.user, project=project_client.project, category=cat, amount=1500, type='expense')
        response = project_client.post(f'/api/budget-categories/{bc.id}/update_spent/')
        assert response.status_code == 200
        assert Decimal(response.data['spent']) == 1500

    def test_overview_unauthenticated(self, api_client):
        response = api_client.get('/api/budget-categories/overview/')
        assert response.status_code == 401
