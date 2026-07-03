import { z } from "zod";

export const workspaceRoles = ["admin", "editor", "viewer"] as const;
export const workspaceStatuses = ["active", "suspended"] as const;
export const workspaceMemberStatuses = ["active", "invited", "removed"] as const;

export type WorkspaceRole = (typeof workspaceRoles)[number];
export type WorkspaceStatus = (typeof workspaceStatuses)[number];
export type WorkspaceMemberStatus = (typeof workspaceMemberStatuses)[number];

export type RadarWorkspace = {
  id: string;
  name: string;
  slug: string;
  status: WorkspaceStatus;
};

export type RadarWorkspaceMembership = {
  workspace: RadarWorkspace;
  role: WorkspaceRole;
  memberStatus: WorkspaceMemberStatus;
};

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, "Workspace name must be at least 2 characters.").max(80),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export function createWorkspaceSlug(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "workspace";
}
