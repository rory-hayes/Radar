import "server-only";

import { redirect } from "next/navigation";

import { defaultAuthenticatedPath } from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createWorkspaceSchema,
  createWorkspaceSlug,
  type CreateWorkspaceInput,
  type RadarWorkspace,
  type RadarWorkspaceMembership,
  type WorkspaceMemberStatus,
  type WorkspaceRole,
  type WorkspaceStatus,
} from "@/lib/workspaces/schema";

type WorkspaceMemberRow = {
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  workspace: RadarWorkspace | RadarWorkspace[] | null;
};

export async function getActiveWorkspaceForCurrentUser(): Promise<RadarWorkspaceMembership | null> {
  const user = await getAuthenticatedUser();
  const supabase = await createSupabaseServerClient();

  if (!user || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, status, workspace:workspaces(id, name, slug, status)")
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
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      status: workspace.status as WorkspaceStatus,
    },
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

  return {
    workspace: data as RadarWorkspace,
    error: null,
  };
}

export function redirectToWorkspaceHome() {
  redirect(defaultAuthenticatedPath);
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
