import "server-only";

import { redirect } from "next/navigation";

import { defaultAuthenticatedPath } from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { recordAuditEvent } from "@/lib/audit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createWorkspaceSchema,
  createWorkspaceSlug,
  updateWorkspaceSettingsSchema,
  type CreateWorkspaceInput,
  type RadarWorkspace,
  type RadarWorkspaceMembership,
  type UpdateWorkspaceSettingsInput,
  type WorkspaceMemberStatus,
  type WorkspaceRole,
  type WorkspaceStatus,
  type WorkspaceTeamVisibility,
} from "@/lib/workspaces/schema";
import { membershipCan } from "@/lib/workspaces/permissions";

type WorkspaceMemberRow = {
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  workspace: WorkspaceRow | WorkspaceRow[] | null;
};

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  status: WorkspaceStatus;
  team_visibility?: WorkspaceTeamVisibility;
};

export async function getActiveWorkspaceForCurrentUser(): Promise<RadarWorkspaceMembership | null> {
  const user = await getAuthenticatedUser();
  const supabase = await createSupabaseServerClient();

  if (!user || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, status, workspace:workspaces(id, name, slug, status, team_visibility)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<WorkspaceMemberRow>();

  if (error) {
    throw new Error(`Unable to load workspace membership: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const workspace = Array.isArray(data.workspace) ? data.workspace[0] : data.workspace;

  if (!workspace) {
    return null;
  }

  return {
    workspace: mapWorkspaceRow(workspace),
    role: data.role,
    memberStatus: data.status,
  };
}

export async function requireActiveWorkspace() {
  const membership = await getActiveWorkspaceForCurrentUser();

  if (!membership) {
    redirect("/workspace/new");
  }

  return membership;
}

export async function createWorkspaceForCurrentUser(input: CreateWorkspaceInput) {
  const parsedInput = createWorkspaceSchema.parse(input);
  const user = await getAuthenticatedUser();
  const supabase = await createSupabaseServerClient();

  if (!user || !supabase) {
    return {
      workspace: null,
      error: "Sign in before creating a workspace.",
    };
  }

  const baseSlug = createWorkspaceSlug(parsedInput.name);
  const slug = `${baseSlug}-${user.id.slice(0, 8)}`;
  const { data, error } = await supabase.rpc("create_workspace_with_admin_membership", {
    workspace_name: parsedInput.name,
    workspace_slug: slug,
  });

  if (error) {
    return {
      workspace: null,
      error: mapWorkspaceCreateError(error.message),
    };
  }

  const workspace = mapWorkspaceRow(data as WorkspaceRow);
  const auditResult = await recordAuditEvent({
    workspaceId: workspace.id,
    action: "workspace.created",
    resourceType: "workspace",
    resourceId: workspace.id,
    metadata: {
      slug: workspace.slug,
    },
  });

  if (auditResult.error) {
    return {
      workspace: null,
      error: auditResult.error,
    };
  }

  return {
    workspace,
    error: null,
  };
}

export async function updateWorkspaceSettingsForCurrentUser(input: UpdateWorkspaceSettingsInput) {
  const parsedInput = updateWorkspaceSettingsSchema.parse(input);
  const membership = await requireActiveWorkspace();
  const supabase = await createSupabaseServerClient();

  if (!membershipCan(membership, "workspace:manage")) {
    return {
      workspace: null,
      error: "Only workspace admins can update workspace settings.",
    };
  }

  if (!supabase) {
    return {
      workspace: null,
      error: "Supabase is not configured for this environment.",
    };
  }

  const { data, error } = await supabase
    .from("workspaces")
    .update({
      name: parsedInput.name,
      slug: parsedInput.slug,
      team_visibility: parsedInput.teamVisibility,
    })
    .eq("id", membership.workspace.id)
    .select("id, name, slug, status, team_visibility")
    .single<WorkspaceRow>();

  if (error) {
    return {
      workspace: null,
      error: mapWorkspaceUpdateError(error.message),
    };
  }

  const workspace = mapWorkspaceRow(data);
  const auditResult = await recordAuditEvent({
    workspaceId: workspace.id,
    action: "workspace.updated",
    resourceType: "workspace",
    resourceId: workspace.id,
    metadata: {
      changedFields: ["name", "slug", "teamVisibility"],
    },
  });

  if (auditResult.error) {
    return {
      workspace: null,
      error: auditResult.error,
    };
  }

  return {
    workspace,
    error: null,
  };
}

export function redirectToWorkspaceHome() {
  redirect(defaultAuthenticatedPath);
}

function mapWorkspaceRow(row: WorkspaceRow): RadarWorkspace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    teamVisibility: row.team_visibility ?? "private",
  };
}

function mapWorkspaceCreateError(message: string) {
  if (/duplicate key|unique/i.test(message)) {
    return "That workspace slug already exists. Try a more specific workspace name.";
  }

  if (/row-level security|permission/i.test(message)) {
    return "Radar could not verify your workspace permissions.";
  }

  return "Radar could not create the workspace. Try again.";
}

function mapWorkspaceUpdateError(message: string) {
  if (/duplicate key|unique/i.test(message)) {
    return "That workspace slug already exists. Try another slug.";
  }

  if (/row-level security|permission/i.test(message)) {
    return "Only workspace admins can update workspace settings.";
  }

  return "Radar could not update workspace settings. Try again.";
}
