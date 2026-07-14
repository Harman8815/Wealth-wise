"""
Project / Account Management API views for WealthWise.

Implements the multi-project (workspace) architecture with project-scoped
Role-Based Access Control (RBAC):

  - Project CRUD (a project is an independent finance workspace)
  - Project members (users with per-project roles)
  - Project invitations (email invites -> membership on accept)
  - A current-project context endpoint + RBAC permission classes
"""
from datetime import timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from ..models import Project, ProjectMember, ProjectInvitation, User
from ..serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    ProjectMemberSerializer,
    AddProjectMemberSerializer,
    UpdateProjectMemberSerializer,
    ProjectInvitationSerializer,
    CreateProjectInvitationSerializer,
)
from ..base import StandardResultsSetPagination, PermissionDenied, NotFoundException

INVITATION_TTL_DAYS = 7
PROJECT_ROLES = [r[0] for r in ProjectMember.ROLE_CHOICES]
ROLE_RANK = {'viewer': 0, 'editor': 1, 'admin': 2, 'owner': 3}


# ---------------------------------------------------------------------------
# RBAC permission helpers (project-scoped)
# ---------------------------------------------------------------------------

def get_membership(user, project):
    """Return the ProjectMember for (user, project) or None."""
    return ProjectMember.objects.filter(user=user, project=project).first()


def require_role(project, user, min_role):
    """Raise PermissionDenied unless user has at least `min_role` in project."""
    membership = get_membership(user, project)
    if not membership:
        raise PermissionDenied('You are not a member of this project.')
    if ROLE_RANK.get(membership.role, -1) < ROLE_RANK.get(min_role, 99):
        raise PermissionDenied('You do not have sufficient permissions for this action.')
    return membership


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------

class ProjectViewSet(viewsets.ModelViewSet):
    """Manage projects, members, invitations and the active project context."""

    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    ordering = ['-created_at']

    def get_queryset(self):
        """Projects the current user is a member of."""
        return Project.objects.filter(members__user=self.request.user).annotate(
            member_count=Count('members', distinct=True)
        ).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return ProjectCreateSerializer
        return ProjectSerializer

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}

    def perform_create(self, serializer):
        """Create the project and make the creator the Owner."""
        project = serializer.save(created_by=self.request.user)
        ProjectMember.objects.create(
            project=project,
            user=self.request.user,
            role='owner',
            invited_by=self.request.user,
        )

    def retrieve(self, request, *args, **kwargs):
        project = self.get_object()
        require_role(project, request.user, 'viewer')
        return Response(ProjectSerializer(project, context={'request': request}).data)

    def perform_update(self, serializer):
        project = serializer.instance
        require_role(project, self.request.user, 'owner')
        serializer.save()

    def perform_destroy(self, instance):
        require_role(instance, self.request.user, 'owner')
        instance.delete()

    # -- Members ----------------------------------------------------------

    @action(detail=True, methods=['get', 'post', 'patch', 'delete'])
    def members(self, request, pk=None):
        project = self.get_object()
        require_role(project, request.user, 'viewer')

        if request.method == 'GET':
            from django.db.models import Q
            qs = project.members.select_related('user', 'invited_by').order_by('joined_at')
            search = request.query_params.get('search')
            role = request.query_params.get('role')
            if search:
                qs = qs.filter(Q(user__email__icontains=search) | Q(user__name__icontains=search))
            if role:
                qs = qs.filter(role=role)
            page = self.paginate_queryset(qs)
            if page is not None:
                return self.get_paginated_response(ProjectMemberSerializer(page, many=True).data)
            return Response(ProjectMemberSerializer(qs, many=True).data)

        if request.method == 'POST':
            require_role(project, request.user, 'admin')
            data = AddProjectMemberSerializer(data=request.data)
            data.is_valid(raise_exception=True)
            email = data.validated_data['email']
            role = data.validated_data['role']

            user = User.objects.filter(email__iexact=email).first()
            if user is None:
                raise NotFoundException('No user with that email exists yet. Invite them instead.')
            if ProjectMember.objects.filter(project=project, user=user).exists():
                raise PermissionDenied('That user is already a member of this project.')

            member = ProjectMember.objects.create(
                project=project, user=user, role=role, invited_by=request.user
            )
            return Response(ProjectMemberSerializer(member).data, status=status.HTTP_201_CREATED)

        if request.method == 'PATCH':
            require_role(project, request.user, 'owner')
            member_id = request.data.get('member_id') or request.query_params.get('member_id')
            member = get_object_or_404(ProjectMember, id=member_id, project=project)
            data = UpdateProjectMemberSerializer(data=request.data)
            data.is_valid(raise_exception=True)
            new_role = data.validated_data['role']

            if member.role == 'owner' and new_role != 'owner':
                if ProjectMember.objects.filter(project=project, role='owner').count() <= 1:
                    raise PermissionDenied('A project must have at least one owner.')

            member.role = new_role
            member.save(update_fields=['role'])
            return Response(ProjectMemberSerializer(member).data)

        # DELETE (remove member)
        require_role(project, request.user, 'owner')
        member_id = request.data.get('member_id') or request.query_params.get('member_id')
        member = get_object_or_404(ProjectMember, id=member_id, project=project)

        if member.user_id == request.user.id:
            raise PermissionDenied('You cannot remove yourself. Transfer ownership first.')
        if member.role == 'owner':
            raise PermissionDenied('Cannot remove an owner. Transfer ownership first.')
        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # -- Invitations ------------------------------------------------------

    @action(detail=True, methods=['get', 'post', 'delete'])
    def invitations(self, request, pk=None):
        project = self.get_object()
        require_role(project, request.user, 'viewer')

        if request.method == 'GET':
            qs = project.invitations.select_related('invited_by').all()
            return Response(ProjectInvitationSerializer(qs, many=True).data)

        if request.method == 'POST':
            require_role(project, request.user, 'admin')
            data = CreateProjectInvitationSerializer(data=request.data)
            data.is_valid(raise_exception=True)
            email = data.validated_data['email']
            role = data.validated_data['role']

            user = User.objects.filter(email__iexact=email).first()
            if user is not None and ProjectMember.objects.filter(project=project, user=user).exists():
                raise PermissionDenied('That user is already a member of this project.')

            invitation = self._get_or_create_invitation(project, email, role, request.user)
            return Response(ProjectInvitationSerializer(invitation).data, status=status.HTTP_201_CREATED)

        # DELETE (cancel invitation)
        require_role(project, request.user, 'admin')
        invitation_id = request.data.get('invitation_id') or request.query_params.get('invitation_id')
        invitation = get_object_or_404(ProjectInvitation, id=invitation_id, project=project)
        invitation.status = 'declined'
        invitation.save(update_fields=['status'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def resend_invitation(self, request, pk=None):
        project = self.get_object()
        require_role(project, request.user, 'admin')
        invitation_id = request.data.get('invitation_id')
        invitation = get_object_or_404(ProjectInvitation, id=invitation_id, project=project)
        if invitation.status not in ('pending', 'expired', 'declined'):
            raise PermissionDenied('This invitation can no longer be resent.')
        invitation.status = 'pending'
        invitation.token = __import__('uuid').uuid4()
        invitation.expires_at = timezone.now() + timedelta(days=INVITATION_TTL_DAYS)
        invitation.accepted_at = None
        invitation.save(update_fields=['status', 'token', 'expires_at', 'accepted_at'])
        return Response(ProjectInvitationSerializer(invitation).data)

    def _get_or_create_invitation(self, project, email, role, inviter):
        """Create a fresh pending invitation, replacing any prior one for the email."""
        ProjectInvitation.objects.filter(project=project, email__iexact=email).exclude(
            status='accepted'
        ).delete()
        return ProjectInvitation.objects.create(
            project=project,
            email=email,
            role=role,
            invited_by=inviter,
            status='pending',
            expires_at=timezone.now() + timedelta(days=INVITATION_TTL_DAYS),
        )

    # -- Current project context -----------------------------------------

    @action(detail=False, methods=['get'])
    def context(self, request):
        """Return the active project for the current user.

        Resolution order:
          1. X-Project-Id header (if the user is a member)
          2. The user's most recently joined project
        """
        project_id = request.headers.get('X-Project-Id')
        project = None
        if project_id:
            project = Project.objects.filter(id=project_id, members__user=request.user).first()
        if project is None:
            project = (
                Project.objects.filter(members__user=request.user)
                .order_by('-members__joined_at')
                .first()
            )
        if project is None:
            raise NotFoundException('You are not a member of any project.')

        membership = get_membership(request.user, project)
        return Response({
            'project': ProjectSerializer(project, context={'request': request}).data,
            'role': membership.role if membership else None,
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_invitation(request):
    """Accept a project invitation by token.

    Requires an authenticated user whose email matches the invitation.
    """
    token = (request.data or {}).get('token')
    if not token:
        raise NotFoundException('Invitation token is required.')

    invitation = get_object_or_404(ProjectInvitation, token=token)
    if invitation.status != 'pending':
        raise PermissionDenied('This invitation is no longer valid.')
    if invitation.is_expired:
        invitation.status = 'expired'
        invitation.save(update_fields=['status'])
        raise PermissionDenied('This invitation has expired.')

    user_email = (request.user.email or '').strip().lower()
    if user_email != invitation.email.strip().lower():
        raise PermissionDenied('This invitation was sent to a different email address.')

    if ProjectMember.objects.filter(project=invitation.project, user=request.user).exists():
        invitation.status = 'accepted'
        invitation.accepted_at = timezone.now()
        invitation.save(update_fields=['status', 'accepted_at'])
        return Response({'detail': 'You are already a member of this project.'})

    ProjectMember.objects.create(
        project=invitation.project,
        user=request.user,
        role=invitation.role,
        invited_by=invitation.invited_by,
    )
    invitation.status = 'accepted'
    invitation.accepted_at = timezone.now()
    invitation.save(update_fields=['status', 'accepted_at'])

    return Response({
        'detail': 'Invitation accepted.',
        'project': ProjectSerializer(invitation.project, context={'request': request}).data,
        'role': invitation.role,
    })
