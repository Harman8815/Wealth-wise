"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveProject } from "@/components/project/project-context";
import { cn } from "@/lib/utils";

export function ProjectSwitcher() {
  const router = useRouter();
  const { projects, activeProject, setActiveProject, isLoading } = useActiveProject();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-3 text-slate-100 hover:bg-slate-800/60 hover:text-white"
        >
          <span className="flex items-center gap-2 truncate">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
              style={{ backgroundColor: activeProject?.color ?? "#3b82f6" }}
            >
              {activeProject?.name?.charAt(0)?.toUpperCase() ?? "W"}
            </span>
            <span className="truncate font-medium">
              {isLoading ? "Loading…" : activeProject?.name ?? "No project"}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[220px] bg-[#0b1220] text-slate-100 border-slate-800"
      >
        <DropdownMenuLabel className="text-xs text-slate-400">Your projects</DropdownMenuLabel>
        {projects.length === 0 && (
          <DropdownMenuItem disabled className="text-slate-500">
            No projects yet
          </DropdownMenuItem>
        )}
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onSelect={() => setActiveProject(project.id)}
            className="gap-2"
          >
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
              style={{ backgroundColor: project.color }}
            >
              {project.name.charAt(0).toUpperCase()}
            </span>
            <span className="flex-1 truncate">{project.name}</span>
            {project.id === activeProject?.id && <Check className="h-4 w-4 text-blue-400" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuItem
          onSelect={() => {
            setOpen(false);
            router.push("/dashboard/projects");
          }}
          className="gap-2 text-blue-300 focus:text-blue-200"
        >
          <Plus className="h-4 w-4" />
          New project
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            setOpen(false);
            router.push("/dashboard/projects");
          }}
          className="gap-2 text-slate-300 focus:text-white"
        >
          <FolderKanban className="h-4 w-4" />
          Manage projects
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
