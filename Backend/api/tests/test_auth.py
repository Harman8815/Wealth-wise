import pytest
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import User
from .factories import UserFactory


pytestmark = [pytest.mark.auth, pytest.mark.django_db]


class TestAuth:
    def test_login_success(self, api_client, user_with_password, password):
        response = api_client.post('/api/auth/login/', {
            'email': user_with_password.email,
            'password': password,
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_login_invalid_credentials(self, api_client, user_with_password):
        response = api_client.post('/api/auth/login/', {
            'email': user_with_password.email,
            'password': 'wrong-password',
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_missing_fields(self, api_client):
        response = api_client.post('/api/auth/login/', {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_refresh_token_success(self, api_client, user_with_password):
        refresh = RefreshToken.for_user(user_with_password)
        response = api_client.post('/api/auth/refresh/', {
            'refresh': str(refresh),
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data

    def test_refresh_token_invalid(self, api_client):
        response = api_client.post('/api/auth/refresh/', {
            'refresh': 'invalid-token',
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_quick_login_success(self, api_client, user_with_password):
        response = api_client.post('/api/auth/quick-login/', {
            'email': user_with_password.email,
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_quick_login_missing_email(self, api_client):
        response = api_client.post('/api/auth/quick-login/', {})
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_quick_login_nonexistent_user(self, api_client):
        response = api_client.post('/api/auth/quick-login/', {
            'email': 'noone@wealthwise.test',
        })
        assert response.status_code == status.HTTP_404_NOT_FOUND
