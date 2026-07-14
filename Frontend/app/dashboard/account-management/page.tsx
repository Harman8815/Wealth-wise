"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, UserPlus, RotateCw, X, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  useActiveProject,
} from "@/components/project/project-context";
import {
  useProjectMembers,
  useProjectInvitations,
  useAddMember,
  useUpdateMemberRole,
  useRemoveMember,
  useCreateInvitation,
  useCancelInvitation,
  useResendInvitation,
} from "@/hooks/use-projects";
import { toast } from "@/hooks/use-toast";
import { type ProjectRole } from "@/api/services";

const ROLES: ProjectRole[] = ["owner", "admin", "editor", "viewer"];
const ROLE_STYLES: Record<string, string> = {
  owner: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  admin: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  editor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  viewer: "bg-slate-500/20 text-slate-300 border-slate-500/40",
};

export default function AccountManagementPage() {
  const router = useRouter();
  const { activeProject, role, setActiveProject } = useActiveProject();
  const projectId = activeProject?.id ?? "";

  const { data: members = [], isLoading: loadingMembers } = useProjectMembers(projectId);
  const { data: invitations = [], isLoading: loadingInvites } = useProjectInvitations(projectId);

  const addMember = useAddMember(projectId);
  const updateMemberRole = useUpdateMemberRole(projectId);
  const removeMember = useRemoveMember(projectId);
  const createInvitation = useCreateInvitation(projectId);
  const cancelInvitation = useCancelInvitation(projectId);
  const resendInvitation = useResendInvitation(projectId);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ProjectRole>("editor");

  const isOwner = role === "owner";
  const canManage = isOwner || role === "admin";

  if (!activeProject) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">No active project</h1>
        <p className="mt-2 text-slate-500">Select or create a project to manage its members.</p>
        <Button className="mt-4" onClick={() => router.push("/dashboard/projects")}>
          Go to projects
        </Button>
      </div>
    );
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: "Enter an email address", variant: "destructive" });
      return;
    }
    try {
      await createInvitation.mutateAsync({ email: inviteEmail.trim(), role: inviteRole });
      toast({ title: "Invitation sent" });
      setInviteEmail("");
    } catch (e: any) {
      const detail = e?.response?.data?.detail || "Could not send invitation";
      toast({ title: detail, variant: "destructive" });
    }
  };

  const handleAddExisting = async (email: string) => {
    try {
      await addMember.mutateAsync({ email, role: "editor" });
      toast({ title: "Member added" });
    } catch (e: any) {
      const detail = e?.response?.data?.detail || "Could not add member";
      toast({ title: detail, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-lg text-lg font-bold text-white"
              style={{ backgroundColor: activeProject.color }}
            >
              {activeProject.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {activeProject.name}
              </h1>
              <p className="flex items-center gap-1 text-sm text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" /> Your role:
                <Badge variant="outline" className={ROLE_STYLES[role ?? "viewer"]}>
                  {role}
                </Badge>
              </p>
            </div>
          </div>
          {!isOwner && (
            <Button variant="outline" className="gap-2" disabled>
              <LogOut className="h-4 w-4" /> Leave project
            </Button>
          )}
        </div>

        <Tabs defaultValue="members">
          <TabsList className="bg-slate-200 dark:bg-slate-800">
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
            <TabsTrigger value="invitations">
              Pending invitations ({invitations.filter((i) => i.status === "pending").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Project members</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMembers ? (
                  <p className="text-slate-500">Loading members…</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-400">Member</TableHead>
                        <TableHead className="text-slate-400">Role</TableHead>
                        <TableHead className="text-right text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => {
                        const isSelf = member.user === activeProject.created_by;
                        return (
                          <TableRow key={member.id} className="border-slate-800">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-slate-700 text-xs">
                                    {member.name?.charAt(0)?.toUpperCase() ??
                                      member.email.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                    {member.name || member.email}
                                  </div>
                                  <div className="text-xs text-slate-500">{member.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {isOwner ? (
                                <Select
                                  value={member.role}
                                  onValueChange={(value) =>
                                    updateMemberRole.mutateAsync({
                                      memberId: member.id,
                                      role: value as ProjectRole,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8 w-32 border-slate-700 bg-slate-900">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="border-slate-800 bg-[#0b1220] text-slate-100">
                                    {ROLES.map((r) => (
                                      <SelectItem key={r} value={r}>
                                        {r}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge variant="outline" className={ROLE_STYLES[member.role]}>
                                  {member.role}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {isOwner && members.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300"
                                  onClick={() => removeMember.mutateAsync(member.id)}
                                >
                                  Remove
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}

                {canManage && (
                  <div className="mt-5 flex items-end gap-2 border-t border-slate-800 pt-4">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="add-member" className="text-xs text-slate-400">
                        Add existing user by email
                      </Label>
                      <Input
                        id="add-member"
                        placeholder="teammate@example.com"
                        className="bg-slate-900 border-slate-700"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <Button
                      className="gap-2"
                      onClick={() => handleAddExisting(inviteEmail.trim())}
                      disabled={!inviteEmail.trim() || addMember.isPending}
                    >
                      <UserPlus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invitations">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Invite to project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {canManage && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="invite-email" className="text-xs text-slate-400">
                        Email address
                      </Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="friend@example.com"
                        className="bg-slate-900 border-slate-700"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="w-40 space-y-1">
                      <Label className="text-xs text-slate-400">Role</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as ProjectRole)}>
                        <SelectTrigger className="bg-slate-900 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-slate-800 bg-[#0b1220] text-slate-100">
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="gap-2" onClick={handleInvite} disabled={createInvitation.isPending}>
                      <Mail className="h-4 w-4" /> Send invite
                    </Button>
                  </div>
                )}

                <div>
                  <h4 className="mb-2 text-sm font-medium text-slate-400">Pending invitations</h4>
                  {loadingInvites ? (
                    <p className="text-slate-500">Loading…</p>
                  ) : invitations.filter((i) => i.status === "pending").length === 0 ? (
                    <p className="text-sm text-slate-500">No pending invitations.</p>
                  ) : (
                    <div className="space-y-2">
                      {invitations
                        .filter((i) => i.status === "pending")
                        .map((inv) => (
                          <div
                            key={inv.id}
                            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2"
                          >
                            <div>
                              <div className="text-sm text-slate-200">{inv.email}</div>
                              <Badge variant="outline" className={ROLE_STYLES[inv.role]}>
                                {inv.role}
                              </Badge>
                            </div>
                            {canManage && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-slate-400 hover:text-white"
                                  onClick={() => resendInvitation.mutateAsync(inv.id)}
                                >
                                  <RotateCw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300"
                                  onClick={() => cancelInvitation.mutateAsync(inv.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
