"use client";

import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddMember, useCreateInvitation } from "@/hooks/use-projects";
import { toast } from "@/hooks/use-toast";
import { type ProjectRole } from "@/api/services";

const ROLES: ProjectRole[] = ["owner", "admin", "editor", "viewer"];

export function AddMemberDialog({
  projectId,
  trigger,
}: {
  projectId: string;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectRole>("editor");
  const addMember = useAddMember(projectId);
  const createInvitation = useCreateInvitation(projectId);

  const reset = () => {
    setEmail("");
    setRole("editor");
  };

  const handleSubmit = async () => {
    const value = email.trim().toLowerCase();
    if (!value) {
      toast({ title: "Enter an email address", variant: "destructive" });
      return;
    }
    try {
      await addMember.mutateAsync({ email: value, role });
      toast({ title: "Member added" });
      reset();
      setOpen(false);
    } catch (e: any) {
      const detail: string = e?.response?.data?.detail || "";
      // Unknown user -> fall back to sending an invitation instead.
      if (/invite them instead/i.test(detail)) {
        try {
          await createInvitation.mutateAsync({ email: value, role });
          toast({ title: "User not found — invitation sent" });
          reset();
          setOpen(false);
        } catch (e2: any) {
          toast({
            title: e2?.response?.data?.detail || "Could not invite user",
            variant: "destructive",
          });
        }
        return;
      }
      toast({ title: detail || "Could not add member", variant: "destructive" });
    }
  };

  const isPending = addMember.isPending || createInvitation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-border">
        <DialogHeader>
          <DialogTitle>Add or invite a member</DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter a user&apos;s email and role. If the user already has an account they are added
            immediately; otherwise an invitation is sent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-email">Email address</Label>
            <Input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as ProjectRole)}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border">
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Working…" : "Add / Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
