import pytest
from rest_framework import status

pytestmark = [pytest.mark.auth, pytest.mark.django_db]


class TestAlerts:
    def test_list_requires_auth(self, api_client):
        response = api_client.get(('/api/alerts/'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_alert(self, project_client, user, project):
        payload = {
            'type': 'warning',
            'title': 'Budget exceeded',
            'message': 'You have exceeded your monthly budget',
            'category': 'Budget',
            'priority': 'high',
        }
        response = project_client.post(
            ('/api/alerts/'), payload, format='json', HTTP_X_PROJECT_ID=str(project.id)
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'Budget exceeded'
        assert response.data['read'] is False
        assert str(response.data['project']) == str(project.id)

    def test_mark_read(self, project_client, alert):
        project_client.default_project = alert.project
        response = project_client.post(
            f'/api/alerts/{alert.id}/mark_read/',
            {},
            format='json',
            HTTP_X_PROJECT_ID=str(alert.project.id),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['read'] is True
        alert.refresh_from_db()
        assert alert.read is True

    def test_mark_unread(self, project_client, alert):
        project_client.default_project = alert.project
        alert.read = True
        alert.save(update_fields=['read'])
        response = project_client.post(
            f'/api/alerts/{alert.id}/mark_unread/',
            {},
            format='json',
            HTTP_X_PROJECT_ID=str(alert.project.id),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['read'] is False
        alert.refresh_from_db()
        assert alert.read is False

    def test_mark_dismissed(self, project_client, alert):
        project_client.default_project = alert.project
        response = project_client.post(
            f'/api/alerts/{alert.id}/mark_dismissed/',
            {},
            format='json',
            HTTP_X_PROJECT_ID=str(alert.project.id),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['dismissed'] is True
        alert.refresh_from_db()
        assert alert.dismissed is True

    def test_mark_all_read(self, project_client, alert):
        project_client.default_project = alert.project
        response = project_client.post(
            '/api/alerts/mark_all_read/',
            {},
            format='json',
            HTTP_X_PROJECT_ID=str(alert.project.id),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['marked_count'] >= 1
        alert.refresh_from_db()
        assert alert.read is True

    def test_unread_count(self, project_client, alert):
        project_client.default_project = alert.project
        response = project_client.get(
            '/api/alerts/unread_count/', HTTP_X_PROJECT_ID=str(alert.project.id)
        )
        assert response.status_code == status.HTTP_200_OK
        assert 'unread_count' in response.data
        assert 'total_count' in response.data
        assert response.data['total_count'] >= 1
        assert response.data['unread_count'] >= 1

    def test_by_category(self, project_client, alert):
        project_client.default_project = alert.project
        response = project_client.get(
            '/api/alerts/by_category/', HTTP_X_PROJECT_ID=str(alert.project.id)
        )
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        categories = {item['category'] for item in response.data}
        assert alert.category in categories

    def test_other_user_cannot_see_alert(self, api_client, other_user, alert, password):
        login = api_client.post(
            ('/api/auth/login/'),
            {'email': other_user.email, 'password': password},
            format='json',
        )
        assert login.status_code == status.HTTP_200_OK
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')
        response = api_client.get(
            f'/api/alerts/{alert.id}/', HTTP_X_PROJECT_ID=str(alert.project.id)
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
