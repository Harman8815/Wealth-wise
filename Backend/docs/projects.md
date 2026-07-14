# Projects & Account Management API

Multi-project (workspace) architecture. Every project is an independent finance
workspace; users join a project through a `ProjectMember` record that carries a
**project-scoped role** (RBAC is project-based, not user-based).

All endpoints require authentication (`Authorization: Bearer <access_token>`).
Most endpoints also accept an optional `X-Project-Id` header to scope the request
to a specific project (resolved by the `ProjectContextMiddleware`).

## Roles

| Role    | Permissions                                                            |
| ------- | --------------------------------------------------------------------- |
| owner   | Full access. Transfer ownership, delete project, manage members.      |
| admin   | Manage members and project data. Cannot delete or transfer ownership. |
| editor  | Manage budgets, transactions, and goals within the project.           |
| viewer  | Read-only access.                                                      |

A user (unique email) can belong to multiple projects with **different roles** in each.

## Models

- `Project` – `id`, `name`, `description`, `currency`, `icon`, `color`, `initial_budget`, `created_by`, timestamps.
- `ProjectMember` – `id`, `project`, `user`, `role`, `invited_by`, `joined_at`. Unique `(project, user)`.
- `ProjectInvitation` – `id`, `project`, `email`, `role`, `invited_by`, `status` (pending/accepted/declined/expired), `token`, `expires_at`, `accepted_at`. Unique `(project, email)`.

## Endpoints

Base path: `/api/projects/`

### Projects

| Method | Path                 | Auth role | Description                                   |
| ------ | -------------------- | --------- | --------------------------------------------- |
| GET    | `/projects/`         | any       | List projects the user is a member of.        |
| POST   | `/projects/`         | any       | Create a project (creator becomes `owner`).   |
| GET    | `/projects/{id}/`    | member    | Retrieve a project.                           |
| PATCH  | `/projects/{id}/`    | owner     | Update a project.                             |
| DELETE | `/projects/{id}/`    | owner     | Delete a project.                             |
| GET    | `/projects/context/` | any       | Current project (from `X-Project-Id` or most recent) + caller role. |

### Members (nested under a project)

| Method | Path                          | Auth role        | Description                                  |
| ------ | ----------------------------- | ---------------- | -------------------------------------------- |
| GET    | `/projects/{id}/members/`     | member           | List project members.                        |
| POST   | `/projects/{id}/members/`     | admin+           | Add an existing user by email.               |
| PATCH  | `/projects/{id}/members/`     | owner            | Change a member's role (`member_id`, `role`).|
| DELETE | `/projects/{id}/members/`     | owner            | Remove a member (`member_id`).               |

### Invitations (nested under a project)

| Method | Path                                | Auth role | Description                              |
| ------ | ----------------------------------- | --------- | ---------------------------------------- |
| GET    | `/projects/{id}/invitations/`       | member    | List invitations for the project.        |
| POST   | `/projects/{id}/invitations/`       | admin+    | Invite an email with a role.             |
| DELETE | `/projects/{id}/invitations/`       | admin+    | Cancel an invitation (`invitation_id`).  |
| POST   | `/projects/{id}/resend_invitation/` | admin+    | Resend an invitation (`invitation_id`).  |

### Accept invitation

| Method | Path                          | Auth            | Description                                          |
| ------ | ----------------------------- | --------------- | ---------------------------------------------------- |
| POST   | `/projects/accept-invitation/` | logged-in user  | Accept via `token`. User email must match the invite. |

On accept, a `ProjectMember` is created with the invitation's role and the
invitation is marked `accepted`.

## Notes / future work

The financial entities (transactions, budgets, goals, alerts, categories) are
currently **user-scoped**. Re-scoping them to `Project` (via a `project`
ForeignKey and the `ProjectContextMiddleware`) is the next phase and is the
foundation this module provides.
