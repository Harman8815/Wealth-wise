"use client";

import { useRouter } from "next/navigation";
import { Plus, Users, Wallet, ArrowRight, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useProjects } from "@/hooks/use-projects";
import { useActiveProject } from "@/components/project/project-context";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import { ProjectIcon } from "@/components/project/project-icon";
import { cn } from "@/lib/utils";

const ROLE_STYLES: Record<string, string> = {
  owner: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  admin: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  editor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  viewer: "bg-slate-500/20 text-slate-300 border-slate-500/40",
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
  const { data: projects = [], isLoading } = useProjects();
  const { activeProject, setActiveProject } = useActiveProject();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Projects</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Collaborative finance workspaces. Each project keeps its own budgets, transactions, and members.
            </p>
          </div>
          <CreateProjectDialog
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New project
              </Button>
            }
          />
        </div>

        {isLoading ? (
          <p className="text-slate-500">Loading projects…</p>
        ) : projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                <Wallet className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
                  No projects yet
                </p>
                <p className="text-sm text-slate-500">Create your first workspace to get started.</p>
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
                    "relative overflow-hidden border-slate-200 dark:border-slate-800",
                    isActive && "ring-2 ring-blue-500"
                  )}
                >
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: project.color }}
                  />
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
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {project.name}
                          </h3>
                          {project.user_role && (
                            <Badge
                              variant="outline"
                              className={cn("mt-1", ROLE_STYLES[project.user_role])}
                            >
                              {project.user_role}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isActive && (
                        <Badge className="bg-blue-600 hover:bg-blue-600">Active</Badge>
                      )}
                    </div>

                    <p className="line-clamp-2 min-h-[2.5rem] text-sm text-slate-500 dark:text-slate-400">
                      {project.description || "No description"}
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-md bg-slate-100 p-2 dark:bg-slate-800">
                        <div className="flex items-center justify-center gap-1 text-slate-500">
                          <Users className="h-3 w-3" /> Members
                        </div>
                        <div className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                          {project.member_count}
                        </div>
                      </div>
                      <div className="rounded-md bg-slate-100 p-2 dark:bg-slate-800">
                        <div className="flex items-center justify-center gap-1 text-slate-500">
                          <Wallet className="h-3 w-3" /> Budget
                        </div>
                        <div className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                          {formatCurrency(project.initial_budget, project.currency)}
                        </div>
                      </div>
                      <div className="rounded-md bg-slate-100 p-2 dark:bg-slate-800">
                        <div className="text-slate-500">Currency</div>
                        <div className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                          {project.currency}
                        </div>
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
      </div>
    </div>
  );
}
