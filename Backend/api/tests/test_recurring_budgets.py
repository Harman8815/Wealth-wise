import pytest
from rest_framework import status

pytestmark = [pytest.mark.auth, pytest.mark.django_db]


class TestRecurringBudgets:
    def test_list_requires_auth(self, api_client):
        response = api_client.get(('/api/recurring-budgets/'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_budget(self, project_client, user, project):
        data = {
            'name': 'Monthly Budget',
            'description': 'Auto-generated monthly budget',
            'total_budget': '10000.00',
            'categories': [
                {'name': 'Food', 'budgeted': 5000, 'color': '#ef4444', 'symbol': 'utensils'}
            ],
            'strategy': 'copy_structure',
            'frequency': 'monthly',
            'interval': 1,
            'start_date': '2024-01-01',
            'never_ends': True,
        }
        response = project_client.post(('/api/recurring-budgets/'), data, format='json', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Monthly Budget'

    def test_pause_active_budget(self, project_client, recurring_budget):
        response = project_client.post(f'/api/recurring-budgets/{recurring_budget.id}/pause/', {}, format='json', HTTP_X_PROJECT_ID=str(recurring_budget.project.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'paused'

    def test_pause_completed_budget_returns_400(self, project_client, recurring_budget):
        recurring_budget.status = 'completed'
        recurring_budget.save()
        response = project_client.post(f'/api/recurring-budgets/{recurring_budget.id}/pause/', {}, format='json', HTTP_X_PROJECT_ID=str(recurring_budget.project.id))
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_resume_paused_budget(self, project_client, recurring_budget):
        recurring_budget.status = 'paused'
        recurring_budget.save()
        response = project_client.post(f'/api/recurring-budgets/{recurring_budget.id}/resume/', {}, format='json', HTTP_X_PROJECT_ID=str(recurring_budget.project.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'active'

    def test_generate_now(self, project_client, recurring_budget):
        response = project_client.post(f'/api/recurring-budgets/{recurring_budget.id}/generate_now/', {}, format='json', HTTP_X_PROJECT_ID=str(recurring_budget.project.id))
        assert response.status_code == status.HTTP_201_CREATED
        assert 'execution' in response.data

    def test_executions(self, project_client, recurring_budget):
        response = project_client.get(f'/api/recurring-budgets/{recurring_budget.id}/executions/', HTTP_X_PROJECT_ID=str(recurring_budget.project.id))
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data or isinstance(response.data, list)

    def test_upcoming(self, project_client, recurring_budget):
        response = project_client.get(f'/api/recurring-budgets/{recurring_budget.id}/upcoming/?count=3', HTTP_X_PROJECT_ID=str(recurring_budget.project.id))
        assert response.status_code == status.HTTP_200_OK
        assert 'upcoming' in response.data

    def test_other_user_cannot_see_budget(self, api_client, other_user, recurring_budget, password):
        login_response = api_client.post(('/api/auth/login/'), {'email': other_user.email, 'password': 'testpass123'}, format='json')
        token = login_response.data['access']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = api_client.get(f'/api/recurring-budgets/{recurring_budget.id}/', HTTP_X_PROJECT_ID=str(recurring_budget.project.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND
