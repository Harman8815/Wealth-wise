/**
 * Project Hooks
 * React Query hooks for the multi-project (workspace) architecture.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  projectApi,
  CreateProjectInput,
  UpdateProjectInput,
  AddMemberInput,
  Project,
  ProjectMember,
  ProjectInvitation,
  ProjectRole,
} from '@/api/services';
import { queryKeys } from '@/api/query-client';

// List all projects the current user belongs to
export const useProjects = (page = 1, pageSize = 50) => {
  return useQuery({
    queryKey: [...queryKeys.projects.all, page, pageSize],
    queryFn: () => projectApi.getAll(page, pageSize).then((d) => d.results ?? []),
  });
};

// Current project context
export const useProjectContext = () => {
  return useQuery({
    queryKey: queryKeys.projects.context,
    queryFn: projectApi.getContext,
  });
};

// Create project
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectInput) => projectApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.context });
    },
  });
};

// Update project
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectInput }) =>
      projectApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.id) });
    },
  });
};

// Delete project
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.context });
    },
  });
};

// Members of a project
export const useProjectMembers = (id: string) => {
  return useQuery({
    queryKey: queryKeys.projects.members(id),
    queryFn: () => projectApi.getMembers(id).then((d) => d.results ?? []),
    enabled: !!id,
  });
};

// Add a member (owner/admin)
export const useAddMember = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddMemberInput) => projectApi.addMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(id) });
    },
  });
};

// Update a member's role (owner)
export const useUpdateMemberRole = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: ProjectRole }) =>
      projectApi.updateMemberRole(id, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(id) });
    },
  });
};

// Remove a member (owner)
export const useRemoveMember = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => projectApi.removeMember(id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(id) });
    },
  });
};

// Invitations for a project
export const useProjectInvitations = (id: string) => {
  return useQuery({
    queryKey: queryKeys.projects.invitations(id),
    queryFn: () => projectApi.getInvitations(id),
    enabled: !!id,
  });
};

// Create an invitation (owner/admin)
export const useCreateInvitation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddMemberInput) => projectApi.createInvitation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.invitations(id) });
    },
  });
};

// Cancel an invitation (owner/admin)
export const useCancelInvitation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => projectApi.cancelInvitation(id, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.invitations(id) });
    },
  });
};

// Resend an invitation (owner/admin)
export const useResendInvitation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => projectApi.resendInvitation(id, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.invitations(id) });
    },
  });
};

// Accept an invitation by token
export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => projectApi.acceptInvitation(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.context });
    },
  });
};
