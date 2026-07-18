import pytest
from rest_framework import status

pytestmark = [pytest.mark.auth, pytest.mark.django_db]


class TestReports:
    def test_filter_reports(self, project_client, user, project, transaction):
        response = project_client.post('/api/reports/filter/', {
            'start_date': '2024-01-01',
            'end_date': '2024-12-31',
        }, format='json', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_200_OK
        assert 'summary' in response.data
        assert 'monthly_stats' in response.data
        assert 'by_category' in response.data

    def test_export_pdf(self, project_client, user, project, transaction):
        response = project_client.get('/api/reports/export_pdf/', {
            'start_date': '2024-01-01',
            'end_date': '2024-12-31',
        }, HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.get('Content-Type') == 'application/pdf'
        assert 'attachment' in response.get('Content-Disposition', '')

    def test_scheduled_reports_crud(self, project_client, user, project):
        response = project_client.get('/api/reports/schedules/', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_200_OK

        response = project_client.post('/api/reports/schedules/', {
            'name': 'Monthly Report',
            'report_type': 'monthly_report',
            'frequency': 'monthly',
        }, format='json', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_201_CREATED
        report_id = response.data['id']

        response = project_client.get(f'/api/reports/schedules/{report_id}/', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_200_OK

        response = project_client.patch(f'/api/reports/schedules/{report_id}/', {
            'enabled': False,
        }, format='json', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_200_OK

        response = project_client.delete(f'/api/reports/schedules/{report_id}/', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_trigger_scheduled_report(self, project_client, user, project, scheduled_report):
        response = project_client.post(f'/api/reports/schedules/{scheduled_report.id}/trigger/', {}, format='json', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.get('Content-Type') == 'application/pdf'

    def test_generate_pdf_report(self, project_client, user, project, transaction):
        response = project_client.get('/api/reports/generate_pdf/?type=complete', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.get('Content-Type') == 'application/pdf'
