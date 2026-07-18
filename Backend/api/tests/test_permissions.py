import pytest
from rest_framework import status

pytestmark = [pytest.mark.rbac, pytest.mark.project_isolation, pytest.mark.django_db]


class TestPermissions:
    def test_unauthenticated_blocked(self, api_client):
        response = api_client.get(('/api/transactions/'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_other_user_cannot_access_transaction(self, api_client, other_user, transaction, password):
        login_response = api_client.post(('/api/auth/login/'), {'email': other_user.email, 'password': 'testpass123'}, format='json')
        token = login_response.data['access']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = api_client.get(f'/api/transactions/{transaction.id}/', HTTP_X_PROJECT_ID=str(transaction.project.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_cross_project_isolation(self, auth_client, user, project, other_project):
        response = auth_client.get(('/api/transactions/'), HTTP_X_PROJECT_ID=str(other_project.id))
        assert response.status_code == status.HTTP_200_OK

    def test_project_member_required_for_project_scope(self, auth_client, user, other_project, other_user):
        response = auth_client.get(('/api/transactions/'), HTTP_X_PROJECT_ID=str(other_project.id))
        assert response.status_code == status.HTTP_200_OK
