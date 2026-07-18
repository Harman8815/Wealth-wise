import pytest
from django.urls import reverse

from api.models import Category
from api.tests.factories import CategoryFactory, ProjectFactory, ProjectMemberFactory

pytestmark = [pytest.mark.django_db]



@pytest.mark.rbac
class TestCategoryCRUD:
    def test_list_authenticated(self, auth_client):
        CategoryFactory.create_batch(3, user=auth_client.user)
        response = auth_client.get(('/api/categories/'))
        assert response.status_code == 200
        assert len(response.data['results']) == 3

    def test_list_unauthenticated(self, api_client):
        response = api_client.get(('/api/categories/'))
        assert response.status_code == 401

    def test_create_category(self, project_client):
        response = project_client.post(('/api/categories/'), {
            'name': 'Food',
            'type': 'expense',
        })
        assert response.status_code == 201
        assert response.data['name'] == 'Food'

    def test_retrieve_own(self, auth_client):
        category = CategoryFactory(user=auth_client.user)
        response = auth_client.get(f'/api/categories/{category.id}/')
        assert response.status_code == 200

    def test_update_own(self, auth_client):
        category = CategoryFactory(user=auth_client.user)
        response = auth_client.patch(f'/api/categories/{category.id}/', {
            'name': 'Updated Category',
        })
        assert response.status_code == 200
        assert response.data['name'] == 'Updated Category'

    def test_delete_own(self, auth_client):
        category = CategoryFactory(user=auth_client.user)
        response = auth_client.delete(f'/api/categories/{category.id}/')
        assert response.status_code == 204

    def test_other_user_cannot_access(self, auth_client, other_user):
        category = CategoryFactory(user=other_user)
        response = auth_client.get(f'/api/categories/{category.id}/')
        assert response.status_code == 404


@pytest.mark.validation
class TestCategoryValidation:
    def test_duplicate_category_returns_existing(self, project_client):
        from api.models import Category
        response1 = project_client.post(('/api/categories/'), {
            'name': 'Unique Category',
            'type': 'expense',
        })
        assert response1.status_code == 201
        response2 = project_client.post(('/api/categories/'), {
            'name': 'Unique Category',
            'type': 'expense',
        })
        assert response2.status_code == 201
        assert Category.objects.filter(
            user=project_client.user, name='Unique Category', type='expense'
        ).count() == 1

    def test_search(self, auth_client):
        CategoryFactory(user=auth_client.user, name='Groceries')
        response = auth_client.get('/api/categories/search/?q=Groc')
        assert response.status_code == 200
        assert len(response.data) >= 1

    def test_defaults(self, auth_client):
        CategoryFactory(user=auth_client.user, is_default=True)
        response = auth_client.get('/api/categories/defaults/')
        assert response.status_code == 200
        assert isinstance(response.data, list)


@pytest.mark.pagination
class TestCategoryPagination:
    def test_default_page_size(self, auth_client):
        CategoryFactory.create_batch(25, user=auth_client.user)
        response = auth_client.get(('/api/categories/'))
        assert response.status_code == 200
        assert len(response.data['results']) == 20
