import pytest
from rest_framework import status

pytestmark = [pytest.mark.auth, pytest.mark.rbac, pytest.mark.project_isolation, pytest.mark.django_db]


class TestProjects:
    def test_list_requires_auth(self, api_client):
        response = api_client.get(('/api/projects/'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_project(self, auth_client, user):
        response = auth_client.post(('/api/projects/'), {
            'name': 'Test Project',
            'description': 'A test project',
            'currency': 'INR',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Test Project'

    def test_create_project_sets_owner(self, auth_client, user):
        response = auth_client.post(('/api/projects/'), {
            'name': 'Test Project',
            'description': 'A test project',
            'currency': 'INR',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        project_id = response.data['id']
        detail = auth_client.get(f'/api/projects/{project_id}/', HTTP_X_PROJECT_ID=str(project_id))
        assert detail.status_code == status.HTTP_200_OK
        assert detail.data['user_role'] == 'owner'

    def test_context_with_header(self, auth_client, user, project):
        response = auth_client.get('/api/projects/context/', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['project']['id'] == str(project.id)

    def test_context_fallback_to_most_recent(self, auth_client, user, project):
        response = auth_client.get('/api/projects/context/')
        assert response.status_code == status.HTTP_200_OK

    def test_add_member(self, auth_client, user, project, other_user):
        response = auth_client.post(f'/api/projects/{project.id}/members/', {
            'email': other_user.email,
            'role': 'editor',
        }, format='json', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['email'] == other_user.email

    def test_add_member_requires_admin(self, project_client, user, project, other_user):
        from api.models import ProjectMember
        membership = ProjectMember.objects.get(project=project, user=user)
        membership.role = 'viewer'
        membership.save(update_fields=['role'])
        response = project_client.post(f'/api/projects/{project.id}/members/', {
            'email': other_user.email,
            'role': 'editor',
        }, format='json', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_remove_self_forbidden(self, auth_client, user, project):
        from api.models import ProjectMember
        response = auth_client.delete(f'/api/projects/{project.id}/members/', {
            'member_id': str(ProjectMember.objects.get(project=project, user=user).id),
        }, format='json', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_remove_owner_forbidden(self, auth_client, user, project, other_user):
        from api.models import ProjectMember
        owner_membership = ProjectMember.objects.get(project=project, user=user)
        ProjectMember.objects.create(project=project, user=other_user, role='admin', invited_by=user)
        response = auth_client.delete(f'/api/projects/{project.id}/members/', {
            'member_id': str(owner_membership.id),
        }, format='json', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_invitations(self, auth_client, user, project, invitation):
        response = auth_client.get(f'/api/projects/{project.id}/invitations/', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_create_invitation(self, auth_client, user, project, other_user):
        response = auth_client.post(f'/api/projects/{project.id}/invitations/', {
            'email': other_user.email,
            'role': 'editor',
        }, format='json', HTTP_X_PROJECT_ID=str(project.id))
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['email'] == other_user.email

    def test_accept_invitation(self, api_client, other_user, invitation, password):
        login_response = api_client.post(('/api/auth/login/'), {'email': other_user.email, 'password': 'testpass123'}, format='json')
        token = login_response.data['access']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = api_client.post('/api/projects/accept-invitation/', {'token': str(invitation.token)}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'project' in response.data

    def test_accept_invitation_wrong_email_forbidden(self, auth_client, user, invitation):
        response = auth_client.post('/api/projects/accept-invitation/', {'token': str(invitation.token)}, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_cross_project_isolation(self, auth_client, user, project, other_project):
        response = auth_client.get(('/api/projects/'))
        assert response.status_code == status.HTTP_200_OK
        project_ids = [p['id'] for p in response.data['results'] if isinstance(response.data, dict) and 'results' in response.data]
        project_ids = [p['id'] for p in response.data] if not isinstance(response.data, dict) or 'results' not in response.data else [p['id'] for p in response.data['results']]
        assert str(other_project.id) not in project_ids
