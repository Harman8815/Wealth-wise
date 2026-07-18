import pytest
from rest_framework import status

pytestmark = [pytest.mark.auth, pytest.mark.django_db]


class TestAlertSettings:
    def test_list_requires_auth(self, api_client):
        response = api_client.get(('/api/alert-settings/'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_alert_setting(self, project_client, user, project):
        payload = {
            'setting_id': 'custom_setting',
            'title': 'Custom Setting',
            'description': 'A custom alert setting',
            'category': 'Budget',
            'enabled': True,
            'threshold': 70,
            'threshold_unit': '%',
        }
        response = project_client.post(
            ('/api/alert-settings/'), payload, format='json', HTTP_X_PROJECT_ID=str(project.id)
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['setting_id'] == 'custom_setting'
        assert response.data['enabled'] is True

    def test_toggle(self, project_client, alert_setting):
        project_client.default_project = alert_setting.project
        original = alert_setting.enabled
        response = project_client.post(
            f'/api/alert-settings/{alert_setting.id}/toggle/',
            {},
            format='json',
            HTTP_X_PROJECT_ID=str(alert_setting.project.id),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['enabled'] is not original
        alert_setting.refresh_from_db()
        assert alert_setting.enabled is not original

    def test_reset_defaults(self, project_client, alert_setting):
        project_client.default_project = alert_setting.project
        response = project_client.post(
            '/api/alert-settings/reset_defaults/',
            {},
            format='json',
            HTTP_X_PROJECT_ID=str(alert_setting.project.id),
        )
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) == 7
        from ..models import AlertSetting
        assert AlertSetting.objects.filter(
            user=project_client.user, project=alert_setting.project
        ).count() == 7

    def test_summary(self, project_client, alert_setting):
        project_client.default_project = alert_setting.project
        response = project_client.get(
            '/api/alert-settings/summary/', HTTP_X_PROJECT_ID=str(alert_setting.project.id)
        )
        assert response.status_code == status.HTTP_200_OK
        assert 'total_settings' in response.data
        assert 'enabled_count' in response.data
        assert 'disabled_count' in response.data
        assert response.data['total_settings'] >= 1

    def test_other_user_cannot_see_alert_setting(self, api_client, other_user, alert_setting, password):
        login = api_client.post(
            ('/api/auth/login/'),
            {'email': other_user.email, 'password': password},
            format='json',
        )
        assert login.status_code == status.HTTP_200_OK
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')
        response = api_client.get(
            f'/api/alert-settings/{alert_setting.id}/',
            HTTP_X_PROJECT_ID=str(alert_setting.project.id),
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
