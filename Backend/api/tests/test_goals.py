import pytest
from rest_framework import status

pytestmark = [pytest.mark.auth, pytest.mark.django_db]


class TestGoals:
    def test_list_requires_auth(self, api_client):
        response = api_client.get(('/api/goals/'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_goal(self, project_client, user, project):
        from datetime import date
        payload = {
            'title': 'Save for laptop',
            'description': 'New work laptop',
            'target_amount': '50000.00',
            'current_amount': '0',
            'target_date': date.today().isoformat(),
            'category': 'Technology',
            'priority': 'high',
            'status': 'active',
        }
        response = project_client.post(
            ('/api/goals/'), payload, format='json', HTTP_X_PROJECT_ID=str(project.id)
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'Save for laptop'
        assert float(response.data['current_amount']) == 0

    def test_contribute(self, project_client, goal):
        project_client.default_project = goal.project
        response = project_client.post(
            f'/api/goals/{goal.id}/contribute/',
            {'amount': 1000},
            format='json',
            HTTP_X_PROJECT_ID=str(goal.project.id),
        )
        assert response.status_code == status.HTTP_200_OK
        assert float(response.data['current_amount']) == float(goal.current_amount) + 1000
        goal.refresh_from_db()
        assert float(goal.current_amount) == 1000

    def test_contribute_auto_complete(self, project_client, goal):
        project_client.default_project = goal.project
        remaining = float(goal.target_amount) - float(goal.current_amount)
        response = project_client.post(
            f'/api/goals/{goal.id}/contribute/',
            {'amount': remaining},
            format='json',
            HTTP_X_PROJECT_ID=str(goal.project.id),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'completed'
        goal.refresh_from_db()
        assert goal.status == 'completed'
        assert goal.completed_at is not None

    def test_toggle_status_active_to_paused(self, project_client, goal):
        project_client.default_project = goal.project
        response = project_client.post(
            f'/api/goals/{goal.id}/toggle_status/',
            {},
            format='json',
            HTTP_X_PROJECT_ID=str(goal.project.id),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'paused'
        goal.refresh_from_db()
        assert goal.status == 'paused'

    def test_toggle_status_rejects_completed(self, project_client, goal):
        project_client.default_project = goal.project
        goal.status = 'completed'
        goal.save(update_fields=['status'])
        response = project_client.post(
            f'/api/goals/{goal.id}/toggle_status/',
            {},
            format='json',
            HTTP_X_PROJECT_ID=str(goal.project.id),
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
        goal.refresh_from_db()
        assert goal.status == 'completed'

    def test_progress(self, project_client, goal):
        project_client.default_project = goal.project
        response = project_client.get(
            '/api/goals/progress/', HTTP_X_PROJECT_ID=str(goal.project.id)
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_goals'] >= 1
        assert 'total_target' in response.data
        assert 'total_saved' in response.data
        assert 'overall_percentage' in response.data
        assert response.data['total_target'] == float(goal.target_amount)

    def test_other_user_cannot_see_goal(self, api_client, other_user, goal, password):
        login = api_client.post(
            ('/api/auth/login/'),
            {'email': other_user.email, 'password': password},
            format='json',
        )
        assert login.status_code == status.HTTP_200_OK
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')
        response = api_client.get(
            f'/api/goals/{goal.id}/', HTTP_X_PROJECT_ID=str(goal.project.id)
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
