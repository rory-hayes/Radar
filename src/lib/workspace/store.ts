import "server-only";

import { getAppUrl } from "@/lib/workspace/url";
import { getDefaultWorkspaceId, getSupabaseAdminClient } from "@/lib/supabase/server";

export type WorkspaceRole =
  | "owner"
  | "admin"
  | "knowledge_manager"
  | "approver"
  | "analyst"
  | "user"
  | "viewer";

export type WorkspaceMember = {
  id: string;
  workspaceId: string;
  email: string;
  name?: string;
  role: WorkspaceRole;
  status: "active" | "invited" | "disabled";
  onboardingState: string;
  invitedByEmail?: string;
  invitedAt?: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceInvite = {
  id: string;
  workspaceId: string;
  email: string;
  role: Exclude<WorkspaceRole, "owner">;
  status: "pending" | "sent" | "accepted" | "revoked" | "expired";
  invitedByEmail: string;
  supabaseUserId?: string;
  sentAt?: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type MemberRow = {
  id: string;
  workspace_id: string;
  email: string;
  name: string | null;
  role: WorkspaceRole;
  status: WorkspaceMember["status"];
  onboarding_state: string;
  invited_by_email: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

type InviteRow = {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceInvite["role"];
  status: WorkspaceInvite["status"];
  invited_by_email: string;
  supabase_user_id: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getWorkspaceId(workspaceId?: string) {
  return workspaceId?.trim() || getDefaultWorkspaceId();
}

export async function ensureWorkspace(workspaceId = getWorkspaceId()) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("radar_workspaces")
    .upsert(
      {
        id: workspaceId,
        name: workspaceId === "radar" ? "Radar" : workspaceId,
      },
      { onConflict: "id" },
    );

  if (error) {
    throw error;
  }
}

export async function getWorkspaceMemberByEmail(email: string, workspaceId = getWorkspaceId()) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("radar_workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("email", normalizeEmail(email))
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toMember(data as MemberRow) : null;
}

export async function upsertWorkspaceMember(input: {
  email: string;
  role: WorkspaceRole;
  status?: WorkspaceMember["status"];
  onboardingState?: string;
  invitedByEmail?: string;
  invitedAt?: string;
  acceptedAt?: string;
  workspaceId?: string;
}) {
  const workspaceId = getWorkspaceId(input.workspaceId);
  await ensureWorkspace(workspaceId);

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("radar_workspace_members")
    .upsert(
      {
        workspace_id: workspaceId,
        email: normalizeEmail(input.email),
        role: input.role,
        status: input.status ?? "active",
        onboarding_state: input.onboardingState ?? "setup_required",
        invited_by_email: input.invitedByEmail ?? null,
        invited_at: input.invitedAt ?? null,
        accepted_at: input.acceptedAt ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,email" },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return toMember(data as MemberRow);
}

export async function listWorkspaceAccess(workspaceId = getWorkspaceId()) {
  const supabase = getSupabaseAdminClient();
  const [membersResult, invitesResult] = await Promise.all([
    supabase
      .from("radar_workspace_members")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    supabase
      .from("radar_workspace_invites")
      .select("*")
      .eq("workspace_id", workspaceId)
      .in("status", ["pending", "sent"])
      .order("created_at", { ascending: false }),
  ]);

  if (membersResult.error) {
    throw membersResult.error;
  }

  if (invitesResult.error) {
    throw invitesResult.error;
  }

  const members = ((membersResult.data ?? []) as MemberRow[]).map(toMember);
  const memberEmails = new Set(members.map((member) => member.email));
  const invites = ((invitesResult.data ?? []) as InviteRow[])
    .map(toInvite)
    .filter((invite) => !memberEmails.has(invite.email));

  return [
    ...members.map((member) => ({
      id: member.id,
      email: member.email,
      name: member.name,
      role: member.role,
      status: member.status,
      onboardingState: member.onboardingState,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    })),
    ...invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      onboardingState: "invite_sent",
      invitedByEmail: invite.invitedByEmail,
      createdAt: invite.createdAt,
      updatedAt: invite.updatedAt,
    })),
  ];
}

export async function createWorkspaceInvite(input: {
  email: string;
  role: WorkspaceInvite["role"];
  invitedByEmail: string;
  workspaceId?: string;
}) {
  const workspaceId = getWorkspaceId(input.workspaceId);
  const email = normalizeEmail(input.email);
  await ensureWorkspace(workspaceId);

  const inviteResult = await sendSupabaseInviteEmail({
    email,
    role: input.role,
    workspaceId,
  });

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("radar_workspace_invites")
    .insert({
      workspace_id: workspaceId,
      email,
      role: input.role,
      status: "sent",
      invited_by_email: normalizeEmail(input.invitedByEmail),
      supabase_user_id: inviteResult.userId ?? null,
      sent_at: now,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await upsertWorkspaceMember({
    workspaceId,
    email,
    role: input.role,
    status: "invited",
    onboardingState: "invite_sent",
    invitedByEmail: input.invitedByEmail,
    invitedAt: now,
  });

  await writeAuditEvent({
    workspaceId,
    actorEmail: input.invitedByEmail,
    action: "member.invited",
    targetType: "workspace_member",
    targetId: email,
    metadata: {
      role: input.role,
      inviteId: (data as InviteRow).id,
    },
  });

  return toInvite(data as InviteRow);
}

export async function sendPasswordResetEmail(email: string) {
  const supabase = getSupabaseAdminClient();
  const appUrl = getAppUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
    redirectTo: `${appUrl}/auth/sign-in?from=recovery`,
  });

  if (error) {
    throw error;
  }
}

export async function writeAuditEvent(input: {
  actorEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  workspaceId?: string;
}) {
  const supabase = getSupabaseAdminClient();
  const workspaceId = getWorkspaceId(input.workspaceId);
  await ensureWorkspace(workspaceId);

  const { error } = await supabase.from("radar_audit_events").insert({
    workspace_id: workspaceId,
    actor_email: normalizeEmail(input.actorEmail),
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw error;
  }
}

async function sendSupabaseInviteEmail(input: {
  email: string;
  role: WorkspaceInvite["role"];
  workspaceId: string;
}) {
  const supabase = getSupabaseAdminClient();
  const appUrl = getAppUrl();
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(input.email, {
    redirectTo: `${appUrl}/auth/accept-invite`,
    data: {
      workspace_id: input.workspaceId,
      workspace_role: input.role,
    },
  });

  if (error) {
    throw error;
  }

  return {
    userId: data.user?.id,
  };
}

function toMember(row: MemberRow): WorkspaceMember {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    email: row.email,
    name: row.name ?? undefined,
    role: row.role,
    status: row.status,
    onboardingState: row.onboarding_state,
    invitedByEmail: row.invited_by_email ?? undefined,
    invitedAt: row.invited_at ?? undefined,
    acceptedAt: row.accepted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toInvite(row: InviteRow): WorkspaceInvite {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    email: row.email,
    role: row.role,
    status: row.status,
    invitedByEmail: row.invited_by_email,
    supabaseUserId: row.supabase_user_id ?? undefined,
    sentAt: row.sent_at ?? undefined,
    acceptedAt: row.accepted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
