import { type RadarWorkspaceMembership, type WorkspaceRole } from "@/lib/workspaces/schema";

export const workspacePermissions = [
  "workspace:read",
  "workspace:manage",
  "assertion:create",
  "assertion:edit",
  "assertion:delete",
  "source:create",
  "source:edit",
  "source:delete",
  "run:rerun",
  "finding:resolve",
] as const;

export type WorkspacePermission = (typeof workspacePermissions)[number];

export const workspacePermissionMatrix = {
  admin: workspacePermissions,
  editor: [
    "workspace:read",
    "assertion:create",
    "assertion:edit",
    "source:create",
    "source:edit",
    "run:rerun",
    "finding:resolve",
  ],
  viewer: ["workspace:read"],
} as const satisfies Record<WorkspaceRole, readonly WorkspacePermission[]>;

export function roleCan(role: WorkspaceRole, permission: WorkspacePermission) {
  return (workspacePermissionMatrix[role] as readonly WorkspacePermission[]).includes(permission);
}

export function membershipCan(membership: RadarWorkspaceMembership, permission: WorkspacePermission) {
  return membership.memberStatus === "active" && membership.workspace.status === "active" && roleCan(membership.role, permission);
}

export function describePermission(permission: WorkspacePermission) {
  const labels = {
    "workspace:read": "view this workspace",
    "workspace:manage": "manage workspace settings and members",
    "assertion:create": "create assertions",
    "assertion:edit": "edit assertions",
    "assertion:delete": "delete assertions",
    "source:create": "create sources",
    "source:edit": "edit sources",
    "source:delete": "delete sources",
    "run:rerun": "rerun checks",
    "finding:resolve": "resolve findings",
  } satisfies Record<WorkspacePermission, string>;

  return labels[permission];
}
