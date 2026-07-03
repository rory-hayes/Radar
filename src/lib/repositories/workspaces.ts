import "server-only";

import {
  type CreateWorkspaceInput,
  type RadarWorkspaceMember,
  type RadarWorkspace,
  type RadarWorkspaceMembership,
  type UpdateWorkspaceSettingsInput,
  type WorkspaceMemberStatus,
  type WorkspaceRole,
  type WorkspaceStatus,
  type WorkspaceTeamVisibility,
} from "@/lib/workspaces/schema";
import {
  workspaceCreateRequestSchema,
  workspaceMembershipResponseSchema,
  workspaceResponseSchema,
  workspaceUpdateSettingsRequestSchema,
} from "@/lib/validation";
import {
  assertRepositorySuccess,
  requireRepositoryRow,
  type RadarRepositoryClient,
} from "@/lib/repositories/client";

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  status: WorkspaceStatus;
  team_visibility: WorkspaceTeamVisibility;
};

type WorkspaceMemberRow = {
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  workspace: WorkspaceRow | WorkspaceRow[] | null;
};

type WorkspaceMemberListRow = {
  user_id: string;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
};

export async function getWorkspaceById(client: RadarRepositoryClient, workspaceId: string) {
  const { data, error } = await client
    .from("workspaces")
    .select("id, name, slug, status, team_visibility")
    .eq("id", workspaceId)
    .maybeSingle<WorkspaceRow>();

  assertRepositorySuccess(error, "Unable to load workspace");
  return data ? mapWorkspaceRow(data) : null;
}

export async function getFirstActiveWorkspaceMembershipForUser(
  client: RadarRepositoryClient,
  userId: string,
): Promise<RadarWorkspaceMembership | null> {
  const { data, error } = await client
    .from("workspace_members")
    .select("role, status, workspace:workspaces(id, name, slug, status, team_visibility)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<WorkspaceMemberRow>();

  assertRepositorySuccess(error, "Unable to load workspace membership");

  if (!data) {
    return null;
  }

  const workspace = Array.isArray(data.workspace) ? data.workspace[0] : data.workspace;

  if (!workspace) {
    return null;
  }

  return workspaceMembershipResponseSchema.parse({
    workspace: mapWorkspaceRow(workspace),
    role: data.role,
    memberStatus: data.status,
  });
}

export async function listActiveWorkspaceMembers(client: RadarRepositoryClient, workspaceId: string) {
  const { data, error } = await client
    .from("workspace_members")
    .select("user_id, role, status")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .returns<WorkspaceMemberListRow[]>();

  assertRepositorySuccess(error, "Unable to list workspace members");
  return (data ?? []).map(mapWorkspaceMemberRow);
}

export async function createWorkspaceWithAdminMembership(
  client: RadarRepositoryClient,
  input: CreateWorkspaceInput & { slug: string },
) {
  const parsedInput = workspaceCreateRequestSchema.parse(input);
  const { data, error } = await client.rpc("create_workspace_with_admin_membership", {
    workspace_name: parsedInput.name,
    workspace_slug: input.slug,
  });

  assertRepositorySuccess(error, "Unable to create workspace");
  return mapWorkspaceRow(requireRepositoryRow(data as WorkspaceRow | null, "Workspace create returned no row"));
}

export async function updateWorkspaceSettings(
  client: RadarRepositoryClient,
  workspaceId: string,
  input: UpdateWorkspaceSettingsInput,
) {
  const parsedInput = workspaceUpdateSettingsRequestSchema.parse(input);
  const { data, error } = await client
    .from("workspaces")
    .update({
      name: parsedInput.name,
      slug: parsedInput.slug,
      team_visibility: parsedInput.teamVisibility,
    })
    .eq("id", workspaceId)
    .select("id, name, slug, status, team_visibility")
    .single<WorkspaceRow>();

  assertRepositorySuccess(error, "Unable to update workspace settings");
  return mapWorkspaceRow(requireRepositoryRow(data, "Workspace update returned no row"));
}

function mapWorkspaceRow(row: WorkspaceRow): RadarWorkspace {
  return workspaceResponseSchema.parse({
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    teamVisibility: row.team_visibility,
  });
}

function mapWorkspaceMemberRow(row: WorkspaceMemberListRow): RadarWorkspaceMember {
  return {
    userId: row.user_id,
    role: row.role,
    memberStatus: row.status,
  };
}
