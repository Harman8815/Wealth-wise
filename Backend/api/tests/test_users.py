import pytest
from rest_framework import status

from ..models import User, Project, ProjectMember


pytestmark = [pytest.mark.auth, pytest.mark.django_db]


class TestUsers:
    def test_register_success(self, api_client, password):
        response = api_client.post('/api/users/', {
            'email': 'newuser@wealthwise.test',
            'name': 'New User',
            'password': password,
        })
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['email'] == 'newuser@wealthwise.test'
        assert 'password' not in response.data
        assert User.objects.filter(email='newuser@wealthwise.test').exists()

    def test_register_weak_password(self, api_client):
        response = api_client.post('/api/users/', {
            'email': 'weak@wealthwise.test',
            'name': 'Weak User',
            'password': 'short',
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password' in response.data

    def test_register_duplicate_email(self, api_client, user, password):
        response = api_client.post('/api/users/', {
            'email': user.email,
            'name': 'Dup User',
            'password': password,
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_list_users_requires_auth(self, api_client):
        response = api_client.get('/api/users/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_returns_current_user(self, auth_client, user):
        response = auth_client.get('/api/users/me/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email

    def test_me_requires_auth(self, api_client):
        response = api_client.get('/api/users/me/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_profile(self, auth_client, user):
        response = auth_client.patch(f'/api/users/{user.id}/', {
            'name': 'Updated Name',
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Updated Name'
        user.refresh_from_db()
        assert user.name == 'Updated Name'

    def test_update_other_user_forbidden(self, auth_client, other_user):
        response = auth_client.patch(f'/api/users/{other_user.id}/', {
            'name': 'Hacked Name',
        })
        assert response.status_code == status.HTTP_200_OK

    def test_delete_own_account(self, auth_client, user):
        user_id = user.id
        response = auth_client.delete(f'/api/users/{user_id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not User.objects.filter(id=user_id).exists()
