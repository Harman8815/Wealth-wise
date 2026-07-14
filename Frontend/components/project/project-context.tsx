"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { projectApi, type Project, type ProjectRole } from "@/api/services";
import { queryKeys } from "@/api/query-client";

const STORAGE_KEY = "wealthwise_active_project";

interface ProjectContextValue {
  projects: Project[];
  activeProject: Project | null;
  activeProjectId: string | null;
  role: ProjectRole | null;
  isLoading: boolean;
  setActiveProject: (id: string) => void;
  refetchProjects: () => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
  );

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: () => projectApi.getAll().then((d) => d.results ?? []),
  });

  const contextQuery = useQuery({
    queryKey: queryKeys.projects.context,
    queryFn: projectApi.getContext,
  });

  const projects = projectsQuery.data ?? [];
  const contextProject = contextQuery.data?.project ?? null;
  const contextRole = contextQuery.data?.role ?? null;

  // Resolve the active project: explicit selection wins, otherwise fall back to
  // the server-resolved context project, then to the first project.
  useEffect(() => {
    const exists = projects.some((p) => p.id === activeProjectId);
    if (!exists) {
      const fallback = contextProject?.id ?? projects[0]?.id ?? null;
      if (fallback) setActiveProjectId(fallback);
    }
  }, [projects, contextProject, activeProjectId]);

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem(STORAGE_KEY, activeProjectId);
    }
  }, [activeProjectId]);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) ?? contextProject ?? projects[0] ?? null;

  const setActiveProject = useCallback(
    (id: string) => {
      setActiveProjectId(id);
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.context });
    },
    [queryClient]
  );

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        activeProjectId,
        role: contextRole,
        isLoading: projectsQuery.isLoading,
        setActiveProject,
        refetchProjects: projectsQuery.refetch,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useActiveProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useActiveProject must be used within a ProjectProvider");
  }
  return ctx;
}
