import { z } from "zod";

export const workspaceRoles = ["admin", "editor", "viewer"] as const;
export const workspaceStatuses = ["active", "suspended"] as const;
export const workspaceMemberStatuses = ["active", "invited", "removed"] as const;
export const workspaceTeamVisibilities = ["private", "workspace"] as const;

export type WorkspaceRole = (typeof workspaceRoles)[number];
export type WorkspaceStatus = (typeof workspaceStatuses)[number];
export type WorkspaceMemberStatus = (typeof workspaceMemberStatuses)[number];
export type WorkspaceTeamVisibility = (typeof workspaceTeamVisibilities)[number];

export type RadarWorkspace = {
  id: string;
  name: string;
  slug: string;
  status: WorkspaceStatus;
  teamVisibility: WorkspaceTeamVisibility;
};

export type RadarWorkspaceMembership = {
  workspace: RadarWorkspace;
  role: WorkspaceRole;
  memberStatus: WorkspaceMemberStatus;
};

export type RadarWorkspaceMember = {
  userId: string;
  role: WorkspaceRole;
  memberStatus: WorkspaceMemberStatus;
};

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, "Workspace name must be at least 2 characters.").max(80),
});

export const updateWorkspaceSettingsSchema = z.object({
  name: z.string().trim().min(2, "Workspace name must be at least 2 characters.").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Workspace slug must be at least 2 characters.")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens only."),
  teamVisibility: z.enum(workspaceTeamVisibilities),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceSettingsInput = z.infer<typeof updateWorkspaceSettingsSchema>;

export function createWorkspaceSlug(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "workspace";
}
