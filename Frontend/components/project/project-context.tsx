"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { projectApi, type Project, type ProjectRole } from "@/api/services";
import { queryKeys } from "@/api/query-client";
import { useSeedHistoricalData } from "@/hooks/use-auth";
import { bumpProjectVersion } from "@/lib/project-version";

const STORAGE_KEY = "wealthwise_active_project";
const SEEDED_KEY = "wealthwise_seeded_projects";

interface ProjectContextValue {
  projects: Project[];
  activeProject: Project | null;
  activeProjectId: string | null;
  role: ProjectRole | null;
  isLoading: boolean;
  isSwitchingProject: boolean;
  setActiveProject: (id: string) => void;
  refetchProjects: () => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

function getSeededProjects(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEDED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeededProjects(projects: Set<string>) {
  localStorage.setItem(SEEDED_KEY, JSON.stringify([...projects]));
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
  );
  const [isSwitchingProject, setIsSwitchingProject] = useState(false);
  const switchIdRef = useRef(0);

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: () => projectApi.getAll().then((d) => d.results ?? []),
  });

  const contextQuery = useQuery({
    queryKey: queryKeys.projects.context,
    queryFn: projectApi.getContext,
  });

  const seedMutation = useSeedHistoricalData();

  const projects = projectsQuery.data ?? [];
  const contextProject = contextQuery.data?.project ?? null;
  const contextRole = contextQuery.data?.role ?? null;

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
    async (id: string) => {
      const currentSwitchId = ++switchIdRef.current;

      setActiveProjectId(id);
      setIsSwitchingProject(true);

      localStorage.setItem(STORAGE_KEY, id);
      bumpProjectVersion();
      queryClient.clear();

      try {
        await queryClient.fetchQuery({
          queryKey: queryKeys.projects.context,
          queryFn: projectApi.getContext,
        });

        if (currentSwitchId === switchIdRef.current) {
          const seeded = getSeededProjects();
          if (!seeded.has(id)) {
            await seedMutation.mutateAsync({ years: 5, projectId: id });
            seeded.add(id);
            saveSeededProjects(seeded);
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 800));
      } catch (err) {
        console.error("Project switch error:", err);
      } finally {
        if (currentSwitchId === switchIdRef.current) {
          setIsSwitchingProject(false);
        }
      }
    },
    [queryClient, seedMutation]
  );

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        activeProjectId,
        role: contextRole,
        isLoading: projectsQuery.isLoading || isSwitchingProject,
        isSwitchingProject,
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
