import pytest
from rest_framework import status
from datetime import date

pytestmark = [pytest.mark.auth, pytest.mark.django_db]


class TestRecurring:
    def test_list_requires_auth(self, api_client):
        response = api_client.get(('/api/recurring/'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_rule(self, project_client, user, project, category):
        data = {
            'name': 'Monthly Rent',
            'description': 'Rent payment',
            'amount': '15000.00',
            'type': 'expense',
            'category_id': str(category.id),
            'frequency': 'monthly',
            'interval': 1,
            'start_date': '2024-01-01',
            'never_ends': True,
        }
        response = project_client.post(('/api/recurring/'), data, format='json', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Monthly Rent'

    def test_pause_active_rule(self, project_client, recurring_rule):
        response = project_client.post(f'/api/recurring/{recurring_rule.id}/pause/', {}, format='json', HTTP_X_PROJECT_ID=str(recurring_rule.project.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'paused'

    def test_pause_completed_rule_returns_400(self, project_client, recurring_rule):
        recurring_rule.status = 'completed'
        recurring_rule.save()
        response = project_client.post(f'/api/recurring/{recurring_rule.id}/pause/', {}, format='json', HTTP_X_PROJECT_ID=str(recurring_rule.project.id))
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_resume_paused_rule(self, project_client, recurring_rule):
        recurring_rule.status = 'paused'
        recurring_rule.save()
        response = project_client.post(f'/api/recurring/{recurring_rule.id}/resume/', {}, format='json', HTTP_X_PROJECT_ID=str(recurring_rule.project.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'active'

    def test_generate_now(self, project_client, recurring_rule):
        response = project_client.post(f'/api/recurring/{recurring_rule.id}/generate_now/', {}, format='json', HTTP_X_PROJECT_ID=str(recurring_rule.project.id))
        assert response.status_code == status.HTTP_201_CREATED
        assert 'execution' in response.data

    def test_executions(self, project_client, recurring_rule):
        response = project_client.get(f'/api/recurring/{recurring_rule.id}/executions/', HTTP_X_PROJECT_ID=str(recurring_rule.project.id))
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data or isinstance(response.data, list)

    def test_upcoming(self, project_client, recurring_rule):
        response = project_client.get(f'/api/recurring/{recurring_rule.id}/upcoming/?count=3', HTTP_X_PROJECT_ID=str(recurring_rule.project.id))
        assert response.status_code == status.HTTP_200_OK
        assert 'upcoming' in response.data

    def test_other_user_cannot_see_rule(self, api_client, other_user, recurring_rule, password):
        login_response = api_client.post(('/api/auth/login/'), {'email': other_user.email, 'password': 'testpass123'}, format='json')
        token = login_response.data['access']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = api_client.get(f'/api/recurring/{recurring_rule.id}/', HTTP_X_PROJECT_ID=str(recurring_rule.project.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND
