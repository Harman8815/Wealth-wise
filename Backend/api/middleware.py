"""
Project-based RBAC middleware.

Reads the `X-Project-Id` header on every authenticated request and attaches the
resolved project + the caller's membership to the request object, so downstream
views/services can scope data to the active project without re-resolving it.

This is the foundation for project-scoping every financial entity (transactions,
budgets, goals, etc.) in a later phase.
"""
from django.utils.deprecation import MiddlewareMixin

from .models import Project, ProjectMember


class ProjectContextMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.active_project = None
        request.active_membership = None

        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return

        project_id = request.headers.get('X-Project-Id')
        if not project_id:
            return

        project = Project.objects.filter(id=project_id).first()
        if project is None:
            return

        membership = ProjectMember.objects.filter(project=project, user=user).first()
        if membership is None:
            return

        request.active_project = project
        request.active_membership = membership
