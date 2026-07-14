/**
 * Projects / Account Management API Services
 * Multi-project (workspace) architecture with project-scoped RBAC.
 */
import { apiClient, PaginatedResponse } from '../client';

export type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface Project {
  id: string;
  name: string;
  description: string;
  currency: string;
  icon: string;
  color: string;
  initial_budget: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  member_count: number;
  user_role: ProjectRole | null;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  currency?: string;
  icon?: string;
  color?: string;
  initial_budget?: number;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  currency?: string;
  icon?: string;
  color?: string;
  initial_budget?: number;
}

export interface ProjectMember {
  id: string;
  project: string;
  user: string;
  email: string;
  name: string;
  role: ProjectRole;
  invited_by: string | null;
  joined_at: string;
}

export interface ProjectInvitation {
  id: string;
  project: string;
  email: string;
  role: ProjectRole;
  invited_by: string | null;
  invited_by_email: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  created_at: string;
  expires_at: string | null;
  accepted_at: string | null;
}

export interface ProjectContext {
  project: Project;
  role: ProjectRole;
}

export interface AddMemberInput {
  email: string;
  role: ProjectRole;
}

export const projectApi = {
  // List projects the current user belongs to
  getAll: async (page = 1, pageSize = 50) => {
    const response = await apiClient.get<PaginatedResponse<Project>>('/projects/', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  // Get a single project
  getById: async (id: string) => {
    const response = await apiClient.get<Project>(`/projects/${id}/`);
    return response.data;
  },

  // Create a project (creator becomes Owner)
  create: async (data: CreateProjectInput) => {
    const response = await apiClient.post<Project>('/projects/', data);
    return response.data;
  },

  // Update a project (owner only)
  update: async (id: string, data: UpdateProjectInput) => {
    const response = await apiClient.patch<Project>(`/projects/${id}/`, data);
    return response.data;
  },

  // Delete a project (owner only)
  remove: async (id: string) => {
    await apiClient.delete(`/projects/${id}/`);
  },

  // Current project context (resolved from X-Project-Id or most recent)
  getContext: async () => {
    const response = await apiClient.get<ProjectContext>('/projects/context/');
    return response.data;
  },

  // --- Members ---
  getMembers: async (id: string, params?: { page?: number; page_size?: number; search?: string; role?: string }) => {
    const response = await apiClient.get<PaginatedResponse<ProjectMember>>(`/projects/${id}/members/`, {
      params: {
        page: params?.page,
        page_size: params?.page_size,
        search: params?.search,
        role: params?.role,
      },
    });
    return response.data;
  },

  addMember: async (id: string, data: AddMemberInput) => {
    const response = await apiClient.post<ProjectMember>(`/projects/${id}/members/`, data);
    return response.data;
  },

  updateMemberRole: async (id: string, memberId: string, role: ProjectRole) => {
    const response = await apiClient.patch<ProjectMember>(`/projects/${id}/members/`, {
      member_id: memberId,
      role,
    });
    return response.data;
  },

  removeMember: async (id: string, memberId: string) => {
    await apiClient.delete(`/projects/${id}/members/`, { data: { member_id: memberId } });
  },

  // --- Invitations ---
  getInvitations: async (id: string) => {
    const response = await apiClient.get<ProjectInvitation[]>(`/projects/${id}/invitations/`);
    return response.data;
  },

  createInvitation: async (id: string, data: AddMemberInput) => {
    const response = await apiClient.post<ProjectInvitation>(`/projects/${id}/invitations/`, data);
    return response.data;
  },

  cancelInvitation: async (id: string, invitationId: string) => {
    await apiClient.delete(`/projects/${id}/invitations/`, { data: { invitation_id: invitationId } });
  },

  resendInvitation: async (id: string, invitationId: string) => {
    const response = await apiClient.post<ProjectInvitation>(`/projects/${id}/resend_invitation/`, {
      invitation_id: invitationId,
    });
    return response.data;
  },

  // Accept an invitation by token (must be logged in as the invited email)
  acceptInvitation: async (token: string) => {
    const response = await apiClient.post<{ detail: string; project: Project; role: ProjectRole }>(
      '/projects/accept-invitation/',
      { token }
    );
    return response.data;
  },
};
