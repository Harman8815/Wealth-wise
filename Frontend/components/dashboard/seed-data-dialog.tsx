"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useProjects } from "@/hooks/use-projects";
import { useSeedHistoricalData } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";
import type { Project } from "@/api/services";

interface SeedDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SeedDataDialog({ open, onOpenChange }: SeedDataDialogProps) {
  const { data: projects, isLoading: isLoadingProjects } = useProjects();
  const seedMutation = useSeedHistoricalData();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [years, setYears] = useState(5);
  const [underBudget, setUnderBudget] = useState(20);
  const [atBudget, setAtBudget] = useState(50);
  const [slightlyOver, setSlightlyOver] = useState(20);
  const [heavilyOver, setHeavilyOver] = useState(10);

  const projectsList = projects ?? [];

  const normalizeBudgetSliders = () => {
    const total = underBudget + atBudget + slightlyOver + heavilyOver;
    if (total === 0) return { under_budget: 25, at_budget: 25, slightly_over: 25, heavily_over: 25 };
    const factor = 100 / total;
    return {
      under_budget: Math.round(underBudget * factor),
      at_budget: Math.round(atBudget * factor),
      slightly_over: Math.round(slightlyOver * factor),
      heavily_over: Math.round(heavilyOver * factor),
    };
  };

  const handleSeed = async () => {
    if (!selectedProjectId) {
      toast({ title: "Please select a project", variant: "destructive" });
      return;
    }
    const budgetSimulation = normalizeBudgetSliders();
    try {
      await seedMutation.mutateAsync({ years, projectId: selectedProjectId, budgetSimulation });
      const selectedProject = projectsList.find((p: Project) => p.id === selectedProjectId);
      toast({
        title: "Seed data generated",
        description: `Demo data has been populated for "${selectedProject?.name}".`,
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Failed to seed data",
        description: err?.response?.data?.detail || err.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border max-w-md">
        <DialogHeader>
          <DialogTitle>Seed Demo Data</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select a project and configure budget simulation to populate with realistic financial data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Project</Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={isLoadingProjects}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent className="border-border">
                {projectsList.map((project: Project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Years of history</Label>
            <Select value={String(years)} onValueChange={(v) => setYears(Number(v))}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border">
                {[1, 2, 3, 5, 10].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y} year{y > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Budget Simulation</Label>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Under budget</span>
                  <span>{underBudget}%</span>
                </div>
                <Slider value={[underBudget]} onValueChange={([v]) => setUnderBudget(v)} min={0} max={100} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>At budget</span>
                  <span>{atBudget}%</span>
                </div>
                <Slider value={[atBudget]} onValueChange={([v]) => setAtBudget(v)} min={0} max={100} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Slightly over budget</span>
                  <span>{slightlyOver}%</span>
                </div>
                <Slider value={[slightlyOver]} onValueChange={([v]) => setSlightlyOver(v)} min={0} max={100} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Heavily over budget</span>
                  <span>{heavilyOver}%</span>
                </div>
                <Slider value={[heavilyOver]} onValueChange={([v]) => setHeavilyOver(v)} min={0} max={100} />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSeed} disabled={seedMutation.isPending || !selectedProjectId}>
            {seedMutation.isPending ? "Seeding…" : "Seed Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
