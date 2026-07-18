import pytest
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile

pytestmark = [pytest.mark.auth, pytest.mark.django_db]


class TestDataIO:
    def test_upload_requires_auth(self, api_client):
        response = api_client.post('/api/imports/upload/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_upload_success(self, auth_client, user, project):
        csv_content = b'date,description,amount,type\n2024-01-01,Test Income,1000,income\n'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')
        response = auth_client.post('/api/imports/upload/', {'file': file}, format='multipart', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_200_OK
        assert 'job_id' in response.data

    def test_import_history(self, auth_client, user, project, import_job):
        response = auth_client.get('/api/imports/history/', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)

    def test_mapping_templates_crud(self, auth_client, user, project, mapping_template):
        response = auth_client.get('/api/imports/mapping-templates/', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)

        response = auth_client.post('/api/imports/mapping-templates/', {
            'name': 'Test Template',
            'mapping': {'date': 'date', 'description': 'desc'},
        }, format='json', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_200_OK

        template_id = response.data['id']
        response = auth_client.delete(f'/api/imports/mapping-templates/{template_id}/', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_export_data_csv(self, auth_client, user, project, transaction):
        response = auth_client.post(('/api/exports/'), {
            'format': 'csv',
            'dataset': 'transactions',
        }, format='json', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.get('Content-Type') == 'text/csv'

    def test_export_history(self, auth_client, user, project, export_job):
        response = auth_client.get('/api/exports/history/', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
