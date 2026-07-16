"use client";

import { useRouter } from "next/navigation";
import { Plus, Users, Wallet, ArrowRight, Settings2, FolderKanban, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useActiveProject } from "@/components/project/project-context";
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import { ProjectIcon } from "@/components/project/project-icon";
import { cn } from "@/lib/utils";

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  editor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  viewer: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
};

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export default function ProjectsPage() {
  const router = useRouter();
  const { openSidebar } = useDashboardSidebar();
  const { projects = [], activeProject, setActiveProject, isLoading } = useActiveProject();

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50 px-4 md:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Collaborative finance workspaces. Each project keeps its own budgets, transactions, and members.
              </p>
            </div>
          </div>
          <CreateProjectDialog
            trigger={
              <Button className="gap-2 shrink-0">
                <Plus className="h-4 w-4" />
                New project
              </Button>
            }
          />
        </div>
      </header>

      <main className="p-4 md:p-6 space-y-6">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-56 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Wallet className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">No projects yet</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Create your first workspace to get started.</p>
              </div>
              <CreateProjectDialog
                trigger={
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create project
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const isActive = project.id === activeProject?.id;
              return (
                <Card
                  key={project.id}
                  className={cn(
                    "relative overflow-hidden pt-0 transition-colors",
                    isActive && "ring-2 ring-primary"
                  )}
                >
                  <div className="h-1.5 w-full" style={{ backgroundColor: project.color }} />
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                          style={{ backgroundColor: project.color }}
                        >
                          <ProjectIcon icon={project.icon} className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                          {project.user_role && (
                            <Badge variant="outline" className={cn("mt-1 capitalize", ROLE_BADGE[project.user_role])}>
                              {project.user_role}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isActive && <Badge>Active</Badge>}
                    </div>

                    <p className="line-clamp-2 min-h-[2.5rem] text-sm text-gray-600 dark:text-gray-400">
                      {project.description || "No description"}
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-md bg-muted/60 p-2">
                        <div className="flex items-center justify-center gap-1 text-gray-500">
                          <Users className="h-3 w-3" /> Members
                        </div>
                        <div className="mt-1 font-semibold text-gray-900 dark:text-white">
                          {project.member_count}
                        </div>
                      </div>
                      <div className="rounded-md bg-muted/60 p-2">
                        <div className="flex items-center justify-center gap-1 text-gray-500">
                          <Wallet className="h-3 w-3" /> Budget
                        </div>
                        <div className="mt-1 font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(project.initial_budget, project.currency)}
                        </div>
                      </div>
                      <div className="rounded-md bg-muted/60 p-2">
                        <div className="text-gray-500">Currency</div>
                        <div className="mt-1 font-semibold text-gray-900 dark:text-white">{project.currency}</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        className="flex-1 gap-1"
                        onClick={() => {
                          setActiveProject(project.id);
                          router.push("/dashboard");
                        }}
                      >
                        Open <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 gap-1"
                        onClick={() => {
                          setActiveProject(project.id);
                          router.push("/dashboard/account-management");
                        }}
                      >
                        <Settings2 className="h-4 w-4" /> Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
