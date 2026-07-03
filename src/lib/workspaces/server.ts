import "server-only";

import { redirect } from "next/navigation";

import { defaultAuthenticatedPath } from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { recordAuditEvent } from "@/lib/audit/server";
import {
  createWorkspaceWithAdminMembership,
  getFirstActiveWorkspaceMembershipForUser,
  updateWorkspaceSettings,
  RadarRepositoryError,
} from "@/lib/repositories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createWorkspaceSchema,
  createWorkspaceSlug,
  updateWorkspaceSettingsSchema,
  type CreateWorkspaceInput,
  type RadarWorkspaceMembership,
  type UpdateWorkspaceSettingsInput,
} from "@/lib/workspaces/schema";
import { membershipCan } from "@/lib/workspaces/permissions";

export async function getActiveWorkspaceForCurrentUser(): Promise<RadarWorkspaceMembership | null> {
  const user = await getAuthenticatedUser();
  const supabase = await createSupabaseServerClient();

  if (!user || !supabase) {
    return null;
  }

  return getFirstActiveWorkspaceMembershipForUser(supabase, user.id);
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
  let workspace;

  try {
    workspace = await createWorkspaceWithAdminMembership(supabase, {
      name: parsedInput.name,
      slug,
    });
  } catch (error) {
    return {
      workspace: null,
      error: mapWorkspaceCreateError(error),
    };
  }

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

  let workspace;

  try {
    workspace = await updateWorkspaceSettings(supabase, membership.workspace.id, parsedInput);
  } catch (error) {
    return {
      workspace: null,
      error: mapWorkspaceUpdateError(error),
    };
  }

  const auditResult = await recordAuditEvent({
    workspaceId: workspace.id,
    action: "workspace.updated",
    resourceType: "workspace",
    resourceId: workspace.id,
    metadata: {
      changedFields: ["name", "slug", "teamVisibility", "dataRetentionDays"],
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

function mapWorkspaceCreateError(error: unknown) {
  const message = repositoryErrorMessage(error);

  if (/duplicate key|unique/i.test(message)) {
    return "That workspace slug already exists. Try a more specific workspace name.";
  }

  if (/row-level security|permission/i.test(message)) {
    return "Radar could not verify your workspace permissions.";
  }

  return "Radar could not create the workspace. Try again.";
}

function mapWorkspaceUpdateError(error: unknown) {
  const message = repositoryErrorMessage(error);

  if (/duplicate key|unique/i.test(message)) {
    return "That workspace slug already exists. Try another slug.";
  }

  if (/row-level security|permission/i.test(message)) {
    return "Only workspace admins can update workspace settings.";
  }

  return "Radar could not update workspace settings. Try again.";
}

function repositoryErrorMessage(error: unknown) {
  return error instanceof RadarRepositoryError ? error.message : "Unknown repository error";
}
