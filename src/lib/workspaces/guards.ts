import "server-only";

import { requireActiveWorkspace } from "@/lib/workspaces/server";
import {
  describePermission,
  membershipCan,
  type WorkspacePermission,
} from "@/lib/workspaces/permissions";

export class WorkspacePermissionError extends Error {
  constructor(readonly permission: WorkspacePermission) {
    super(`You do not have permission to ${describePermission(permission)}.`);
    this.name = "WorkspacePermissionError";
  }
}

export async function requireWorkspacePermission(permission: WorkspacePermission) {
  const membership = await requireActiveWorkspace();

  if (!membershipCan(membership, permission)) {
    throw new WorkspacePermissionError(permission);
  }

  return membership;
}

export async function getWorkspacePermissionContext() {
  const membership = await requireActiveWorkspace();

  return {
    membership,
    can(permission: WorkspacePermission) {
      return membershipCan(membership, permission);
    },
  };
}
