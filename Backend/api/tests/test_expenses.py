import pytest
from datetime import date, timedelta
from decimal import Decimal

from rest_framework import status

pytestmark = [pytest.mark.auth, pytest.mark.validation, pytest.mark.django_db]


class TestExpenses:
    def test_list_requires_auth(self, api_client):
        response = api_client.get(('/api/expenses/'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_requires_category(self, project_client, user, project):
        payload = {
            'amount': '100.00',
            'note': 'No category provided',
        }
        response = project_client.post(
            ('/api/expenses/'), payload, format='json', HTTP_X_PROJECT_ID=str(project.id)
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_with_category_name(self, project_client, user, project):
        payload = {
            'date': date.today().isoformat(),
            'category_name': 'Groceries',
            'amount': '250.00',
            'note': 'Weekly shopping',
        }
        response = project_client.post(
            ('/api/expenses/'), payload, format='json', HTTP_X_PROJECT_ID=str(project.id)
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['amount'] == '250.00'
        from ..models import Category
        assert Category.objects.filter(
            user=user, name='Groceries', type='expense', project=project
        ).exists()

    def test_summary(self, project_client, expense):
        project_client.default_project = expense.project
        response = project_client.get(
            '/api/expenses/summary/', HTTP_X_PROJECT_ID=str(expense.project.id)
        )
        assert response.status_code == status.HTTP_200_OK
        assert 'total_amount' in response.data
        assert 'expense_count' in response.data
        assert 'by_category' in response.data
        assert response.data['expense_count'] >= 1
        assert response.data['total_amount'] == float(expense.amount)

    def test_recent(self, project_client, expense):
        project_client.default_project = expense.project
        expense.date = date.today()
        expense.save(update_fields=['date'])
        response = project_client.get(
            '/api/expenses/recent/', HTTP_X_PROJECT_ID=str(expense.project.id)
        )
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) >= 1
        ids = {item['id'] for item in response.data}
        assert str(expense.id) in ids

    def test_other_user_cannot_see_expense(self, api_client, other_user, expense, password):
        login = api_client.post(
            ('/api/auth/login/'),
            {'email': other_user.email, 'password': password},
            format='json',
        )
        assert login.status_code == status.HTTP_200_OK
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.data["access"]}')
        response = api_client.get(
            f'/api/expenses/{expense.id}/', HTTP_X_PROJECT_ID=str(expense.project.id)
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
