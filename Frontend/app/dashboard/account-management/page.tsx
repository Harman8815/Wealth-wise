"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  UserPlus,
  RotateCw,
  X,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
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
import { useActiveProject } from "@/components/project/project-context";
import { AddMemberDialog } from "@/components/dashboard/add-member-dialog";
import {
  useProjectMembers,
  useProjectInvitations,
  useUpdateMemberRole,
  useRemoveMember,
  useCreateInvitation,
  useCancelInvitation,
  useResendInvitation,
} from "@/hooks/use-projects";
import { useMe } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { type ProjectRole } from "@/api/services";

const ROLES: ProjectRole[] = ["owner", "admin", "editor", "viewer"];
const ROLE_BADGE: Record<string, string> = {
  owner: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  editor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  viewer: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
};

const PAGE_SIZE = 10;

export default function AccountManagementPage() {
  const router = useRouter();
  const { activeProject, role } = useActiveProject();
  const { data: me } = useMe();
  const projectId = activeProject?.id ?? "";

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: membersData, isLoading: loadingMembers, isFetching } = useProjectMembers(projectId, {
    page,
    page_size: PAGE_SIZE,
    search: search || undefined,
    role: roleFilter === "all" ? undefined : roleFilter,
  });
  const { data: invitations = [], isLoading: loadingInvites } = useProjectInvitations(projectId);

  const updateMemberRole = useUpdateMemberRole(projectId);
  const removeMember = useRemoveMember(projectId);
  const createInvitation = useCreateInvitation(projectId);
  const cancelInvitation = useCancelInvitation(projectId);
  const resendInvitation = useResendInvitation(projectId);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ProjectRole>("editor");

  const isOwner = role === "owner";
  const canManage = isOwner || role === "admin";

  const members = membersData?.results ?? [];
  const total = membersData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!activeProject) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">No active project</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Select or create a project to manage its members.
        </p>
        <Button className="mt-4" onClick={() => router.push("/dashboard/projects")}>
          Go to projects
        </Button>
      </div>
    );
  }

  const pendingInvitations = invitations.filter((i) => i.status === "pending");

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

  const handleRemove = (memberId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this project?`)) return;
    removeMember.mutate(memberId, {
      onSuccess: () => toast({ title: "Member removed" }),
      onError: (e: any) =>
        toast({ title: e?.response?.data?.detail || "Could not remove member", variant: "destructive" }),
    });
  };

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50 px-4 md:px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-lg text-lg font-bold text-white"
            style={{ backgroundColor: activeProject.color }}
          >
            {activeProject.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{activeProject.name}</h1>
            <p className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Your role:
              <Badge variant="outline" className={ROLE_BADGE[role ?? "viewer"]}>
                {role}
              </Badge>
            </p>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 space-y-6">
        <Tabs defaultValue="members">
          <TabsList>
            <TabsTrigger value="members">Members ({total})</TabsTrigger>
            <TabsTrigger value="invitations">Pending invitations ({pendingInvitations.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card>
              <CardHeader className="gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-gray-900 dark:text-white">Project members</CardTitle>
                  {canManage && (
                    <AddMemberDialog
                      projectId={projectId}
                      trigger={
                        <Button className="gap-2">
                          <UserPlus className="h-4 w-4" /> Add member
                        </Button>
                      }
                    />
                  )}
                </div>

                {/* Toolbar: search + role filter */}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search by name or email…"
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={roleFilter}
                    onValueChange={(v) => {
                      setRoleFilter(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="sm:w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent>
                {loadingMembers ? (
                  <p className="text-gray-600 dark:text-gray-400">Loading members…</p>
                ) : members.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-600 dark:text-gray-400">
                    No members match your filters.
                  </p>
                ) : (
                  <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => {
                          const isSelf = me?.id === member.user;
                          const canRemove = isOwner && members.length > 1 && !isSelf;
                          const removeTitle = !isOwner
                            ? "Only owners can remove members"
                            : isSelf
                            ? "You cannot remove yourself"
                            : members.length <= 1
                            ? "A project must keep at least one member"
                            : "Remove member";
                          return (
                            <TableRow key={member.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-muted text-xs">
                                      {member.name?.charAt(0)?.toUpperCase() ??
                                        member.email.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {member.name || member.email}
                                      {isSelf && (
                                        <span className="ml-2 text-[10px] text-muted-foreground">(you)</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{member.email}</div>
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
                                    <SelectTrigger className="h-8 w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ROLES.map((r) => (
                                        <SelectItem key={r} value={r}>
                                          {r}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant="outline" className={ROLE_BADGE[member.role]}>
                                    {member.role}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                                  disabled={!canRemove}
                                  title={removeTitle}
                                  onClick={() => handleRemove(member.id, member.name || member.email)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Pagination */}
                {total > 0 && (
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {total} member{total === 1 ? "" : "s"}
                      {total > PAGE_SIZE && <> · page {page} of {totalPages}</>}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" /> Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Invite to project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {canManage && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="invite-email" className="text-xs text-muted-foreground">
                        Email address
                      </Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="friend@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="w-40 space-y-1">
                      <Label className="text-xs text-muted-foreground">Role</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as ProjectRole)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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
                  <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pending invitations
                  </h4>
                  {loadingInvites ? (
                    <p className="text-gray-600 dark:text-gray-400">Loading…</p>
                  ) : pendingInvitations.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No pending invitations.</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingInvitations.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2"
                        >
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">{inv.email}</div>
                            <Badge variant="outline" className={ROLE_BADGE[inv.role]}>
                              {inv.role}
                            </Badge>
                          </div>
                          {canManage && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                title="Resend invitation"
                                onClick={() => resendInvitation.mutateAsync(inv.id)}
                              >
                                <RotateCw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                title="Cancel invitation"
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
      </main>
    </div>
  );
}
