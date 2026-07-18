import pytest
from rest_framework import status


pytestmark = [pytest.mark.auth, pytest.mark.django_db]


class TestSystem:
    @pytest.mark.django_db
    def test_health_check(self, api_client):
        response = api_client.get('/api/health/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'healthy'
        assert response.data['database'] == 'healthy'
        assert response.data['version'] == '2.0.0'

    @pytest.mark.django_db
    def test_default_user_info(self, api_client):
        response = api_client.get('/api/default-user/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == 'demo@wealthwise.com'
        assert response.data['password'] == 'WealthWise123!'

    def test_seed_data_requires_auth(self, api_client):
        response = api_client.post('/api/seed-data/', {'years': 1})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_seed_data_success(self, auth_client, user, project):
        auth_client.default_project = project
        response = auth_client.post(
            '/api/seed-data/',
            {'years': 1, 'project_id': str(project.id)},
            format='json',
            HTTP_X_PROJECT_ID=str(project.id),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'success'
        assert response.data['data']['accounts_created'] > 0
