import "server-only";

import { getAuthSession } from "@/lib/auth/session";
import { readEnv } from "@/lib/env";
import { listConnectorRequests } from "@/lib/connectors/store";
import {
  getKnowledgeSource,
  listKnowledgeSources,
  listKnowledgeUploads,
} from "@/lib/knowledge/store";
import { getSupabaseRuntimeState, getSupabaseAdminClient, getDefaultWorkspaceId } from "@/lib/supabase/server";
import {
  getWorkspaceId,
  getWorkspaceMemberByEmail,
  listWorkspaceAccess,
  normalizeEmail,
  upsertWorkspaceMember,
  type WorkspaceRole,
} from "@/lib/workspace/store";

export type AdminRole =
  | "owner"
  | "admin"
  | "knowledge_manager"
  | "approver"
  | "analyst"
  | "user"
  | "viewer";

export type AdminCapability =
  | "manageSources"
  | "manageConnectors"
  | "manageUsers"
  | "managePlaybooks"
  | "approveGuidance"
  | "runReplay"
  | "reviewSessions"
  | "viewAnalytics"
  | "manageSettings"
  | "viewAuditLog";

export type AdminResource =
  | "overview"
  | "users"
  | "sources"
  | "uploads"
  | "connectors"
  | "playbooks"
  | "approvals"
  | "testing-replay"
  | "knowledge-gaps"
  | "analytics"
  | "sessions"
  | "settings"
  | "audit-log";

export type AdminRecord = Record<string, unknown>;

export type AdminContext =
  | {
      state: "ready";
      role: AdminRole;
      capabilities: Record<AdminCapability, boolean>;
      apiBaseUrl: string;
      missingConfig: [];
      workspaceId: string;
      authEmail: string;
    }
  | {
      state: "not_configured";
      role: null;
      capabilities: Record<AdminCapability, false>;
      apiBaseUrl: null;
      missingConfig: string[];
    };

export type AdminDataResult<T> =
  | {
      state: "not_configured";
      message: string;
      missingConfig: string[];
    }
  | {
      state: "unauthorized";
      message: string;
    }
  | {
      state: "error";
      message: string;
    }
  | {
      state: "empty";
      message: string;
    }
  | {
      state: "ready";
      data: T;
    };

const capabilityDefaults: Record<AdminCapability, false> = {
  manageSources: false,
  manageConnectors: false,
  manageUsers: false,
  managePlaybooks: false,
  approveGuidance: false,
  runReplay: false,
  reviewSessions: false,
  viewAnalytics: false,
  manageSettings: false,
  viewAuditLog: false,
};

const capabilitiesByRole: Record<AdminRole, AdminCapability[]> = {
  owner: [
    "manageSources",
    "manageConnectors",
    "manageUsers",
    "managePlaybooks",
    "approveGuidance",
    "runReplay",
    "reviewSessions",
    "viewAnalytics",
    "manageSettings",
    "viewAuditLog",
  ],
  admin: [
    "manageSources",
    "manageConnectors",
    "manageUsers",
    "managePlaybooks",
    "approveGuidance",
    "runReplay",
    "reviewSessions",
    "viewAnalytics",
    "manageSettings",
    "viewAuditLog",
  ],
  knowledge_manager: [
    "manageSources",
    "manageConnectors",
    "managePlaybooks",
    "runReplay",
    "reviewSessions",
    "viewAnalytics",
  ],
  approver: ["approveGuidance", "runReplay", "reviewSessions", "viewAnalytics"],
  analyst: ["runReplay", "reviewSessions", "viewAnalytics", "viewAuditLog"],
  user: ["reviewSessions"],
  viewer: ["reviewSessions", "viewAnalytics"],
};

function capabilitiesFor(role: AdminRole): Record<AdminCapability, boolean> {
  const allowed = new Set(capabilitiesByRole[role]);

  return Object.fromEntries(
    Object.keys(capabilityDefaults).map((capability) => [
      capability,
      allowed.has(capability as AdminCapability),
    ]),
  ) as Record<AdminCapability, boolean>;
}

function parseRole(value: string | undefined): AdminRole {
  const normalized = value?.trim();
  const validRoles: AdminRole[] = [
    "owner",
    "admin",
    "knowledge_manager",
    "approver",
    "analyst",
    "user",
    "viewer",
  ];

  if (validRoles.includes(normalized as AdminRole)) {
    return normalized as AdminRole;
  }

  return "viewer";
}

function allowedBootstrapEmails() {
  return new Set(
    (readEnv(process.env.RADAR_AUTH_ALLOWED_EMAILS) ?? "")
      .split(",")
      .map((email) => normalizeEmail(email))
      .filter(Boolean),
  );
}

export async function getAdminContext(): Promise<AdminContext> {
  const runtime = getSupabaseRuntimeState();
  const auth = await getAuthSession();
  const missingConfig = [
    ...(runtime.state === "not_configured" ? runtime.missing : []),
    !auth ? "radar_session" : null,
  ].filter(Boolean) as string[];

  if (runtime.state === "not_configured" || !auth || missingConfig.length > 0) {
    return {
      state: "not_configured",
      role: null,
      capabilities: capabilityDefaults,
      apiBaseUrl: null,
      missingConfig,
    };
  }

  const workspaceId = getDefaultWorkspaceId();
  const member = await getWorkspaceMemberByEmail(auth.email, workspaceId);
  let role = member?.status === "disabled" ? "viewer" : member?.role;

  if (!role && allowedBootstrapEmails().has(auth.email)) {
    role = parseRole(readEnv(process.env.RADAR_ADMIN_ROLE) || "admin");
    await upsertWorkspaceMember({
      workspaceId,
      email: auth.email,
      role: role as WorkspaceRole,
      status: "active",
      onboardingState: "complete",
      acceptedAt: new Date().toISOString(),
    });
  }

  return {
    state: "ready",
    role: parseRole(role),
    capabilities: capabilitiesFor(parseRole(role)),
    apiBaseUrl: "supabase",
    missingConfig: [],
    workspaceId,
    authEmail: auth.email,
  };
}

export function can(
  context: AdminContext,
  capability: AdminCapability,
): boolean {
  return context.capabilities[capability] === true;
}

export async function getAdminCollection(
  resource: AdminResource,
  context?: AdminContext,
): Promise<AdminDataResult<AdminRecord[]>> {
  const adminContext = context ?? (await getAdminContext());

  if (adminContext.state === "not_configured") {
    return {
      state: "not_configured",
      message: "Connect Supabase server configuration before this data can load.",
      missingConfig: adminContext.missingConfig,
    };
  }

  try {
    switch (resource) {
      case "overview":
        return ready([await getOverviewRecord(adminContext)]);
      case "users":
        return toCollection(await listWorkspaceAccess(adminContext.workspaceId));
      case "sources":
        return toCollection(await listSourceRecords(adminContext.workspaceId));
      case "uploads":
        return toCollection(await listUploadRecords(adminContext.workspaceId));
      case "connectors":
        return toCollection(await listConnectorRecords(adminContext.workspaceId));
      case "playbooks":
        return toCollection(await listPlaybookRecords(adminContext.workspaceId));
      case "sessions":
        return toCollection(await listSessionRecords(adminContext.workspaceId));
      case "audit-log":
        return toCollection(await listAuditRecords(adminContext.workspaceId));
      case "settings":
        return ready([await getSettingsRecord(adminContext)]);
      case "analytics":
        return ready([await getAnalyticsRecord(adminContext.workspaceId)]);
      default:
        return {
          state: "empty",
          message: "No records are connected for this workspace view yet.",
        };
    }
  } catch {
    return {
      state: "error",
      message: "Supabase could not return this workspace data.",
    };
  }
}

export async function getAdminRecord(
  resource: "sources" | "playbooks" | "sessions",
  id: string,
  context?: AdminContext,
  childPath?: string,
): Promise<AdminDataResult<AdminRecord>> {
  const adminContext = context ?? (await getAdminContext());

  if (adminContext.state === "not_configured") {
    return {
      state: "not_configured",
      message: "Connect Supabase server configuration before this record can load.",
      missingConfig: adminContext.missingConfig,
    };
  }

  if (resource === "sources" || resource === "playbooks") {
    try {
      const record = await getSourceRecord(id, adminContext.workspaceId);
      if (!record || (resource === "playbooks" && record.sourceType !== "playbook")) {
        return {
          state: "empty",
          message:
            resource === "playbooks"
              ? "This playbook record was not found."
              : "This source record was not found.",
        };
      }

      return ready(record);
    } catch {
      return {
        state: "error",
        message: "Supabase could not return this source record.",
      };
    }
  }

  try {
    const record = await getSessionRecord(id, adminContext.workspaceId, childPath);
    if (!record) {
      return {
        state: "empty",
        message: "This call record was not found.",
      };
    }

    return ready(record);
  } catch {
    return {
      state: "error",
      message: "Supabase could not return this workspace record.",
    };
  }
}

function ready<T>(data: T): AdminDataResult<T> {
  return {
    state: "ready",
    data,
  };
}

function toCollection(records: AdminRecord[]): AdminDataResult<AdminRecord[]> {
  if (records.length === 0) {
    return {
      state: "empty",
      message: "No records have been created for this workspace yet.",
    };
  }

  return ready(records);
}

async function getOverviewRecord(context: Extract<AdminContext, { state: "ready" }>) {
  const supabase = getSupabaseAdminClient();
  const [members, sessions, audit, sources] = await Promise.all([
    supabase
      .from("radar_workspace_members")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", context.workspaceId),
    supabase
      .from("radar_sessions")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", context.workspaceId),
    supabase
      .from("radar_audit_events")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", context.workspaceId),
    supabase
      .from("radar_sources")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", context.workspaceId),
  ]);

  return {
    id: context.workspaceId,
    workspaceId: context.workspaceId,
    users: members.count ?? 0,
    sessions: sessions.count ?? 0,
    auditEvents: audit.count ?? 0,
    sources: sources.count ?? 0,
    status: "connected",
  };
}

async function getAnalyticsRecord(workspaceId: string) {
  const supabase = getSupabaseAdminClient();
  const [sessions, sources, chunks, retrievals] = await Promise.all([
    supabase
      .from("radar_sessions")
      .select("id,status")
      .eq("workspace_id", workspaceId),
    supabase.from("radar_sources").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("radar_source_chunks").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("radar_retrieval_events").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
  ]);
  const sessionRows = ((sessions.data ?? []) as AdminRecord[]).filter((session) => typeof session.id === "string");
  const sessionIds = sessionRows.map((session) => String(session.id));
  const [segments, cards, feedback] =
    sessionIds.length > 0
      ? await Promise.all([
          supabase
            .from("radar_transcript_segments")
            .select("id,session_id")
            .in("session_id", sessionIds),
          supabase
            .from("radar_guidance_cards")
            .select("id,session_id,lane,citations")
            .in("session_id", sessionIds),
          supabase.from("radar_card_feedback").select("id,session_id").in("session_id", sessionIds),
        ])
      : [
          { data: [], count: 0, error: null },
          { data: [], count: 0, error: null },
          { data: [], count: 0, error: null },
        ];

  for (const result of [sessions, sources, chunks, retrievals, segments, cards, feedback]) {
    if (result.error) {
      throw result.error;
    }
  }

  const cardRows = (cards.data ?? []) as AdminRecord[];
  const endedSessions = sessionRows.filter((session) => session.status === "ended").length;
  const activeSessions = sessionRows.filter((session) => session.status === "active").length;
  const pausedSessions = sessionRows.filter((session) => session.status === "paused").length;
  const answerCards = cardRows.filter((card) => card.lane === "answer").length;
  const proofCards = cardRows.filter((card) => card.lane === "proof").length;
  const citedAnswerCards = cardRows.filter(
    (card) =>
      (card.lane === "answer" || card.lane === "proof") &&
      Array.isArray(card.citations) &&
      card.citations.length > 0,
  ).length;

  return {
    id: workspaceId,
    workspaceId,
    sessions: sessionRows.length,
    endedSessions,
    activeSessions,
    pausedSessions,
    transcriptSegments: (segments.data ?? []).length,
    guidanceCards: cardRows.length,
    answerCards,
    proofCards,
    citedAnswerCards,
    needsConfirmationCards: cardRows.filter((card) => card.lane === "needs_confirmation").length,
    escalationCards: cardRows.filter((card) => card.lane === "escalate").length,
    feedbackItems: (feedback.data ?? []).length,
    approvedSources: sources.count ?? 0,
    knowledgeChunks: chunks.count ?? 0,
    retrievalEvents: retrievals.count ?? 0,
  };
}

async function listSourceRecords(workspaceId: string) {
  return (await listKnowledgeSources(workspaceId)).map((source) => ({
    id: source.id,
    title: source.title,
    status: source.status,
    sourceType: source.sourceType,
    uri: source.uri,
    ownerEmail: source.ownerEmail,
    uploadedByEmail: source.uploadedByEmail,
    approvedByEmail: source.approvedByEmail,
    approvedAt: source.approvedAt,
    chunkCount: source.chunkCount,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  }));
}

async function listPlaybookRecords(workspaceId: string) {
  return (await listKnowledgeSources(workspaceId))
    .filter((source) => source.sourceType === "playbook")
    .map((source) => ({
      id: source.id,
      title: source.title,
      status: source.status,
      sourceType: source.sourceType,
      uri: source.uri,
      ownerEmail: source.ownerEmail,
      uploadedByEmail: source.uploadedByEmail,
      approvedByEmail: source.approvedByEmail,
      approvedAt: source.approvedAt,
      chunkCount: source.chunkCount,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    }));
}

async function listUploadRecords(workspaceId: string) {
  return (await listKnowledgeUploads(workspaceId)).map((upload) => ({
    id: upload.id,
    title: upload.fileName ?? upload.sourceId ?? upload.id,
    sourceId: upload.sourceId,
    fileName: upload.fileName,
    contentType: upload.contentType,
    byteSize: upload.byteSize,
    status: upload.status,
    uploadedByEmail: upload.uploadedByEmail,
    errorMessage: upload.errorMessage,
    createdAt: upload.createdAt,
    updatedAt: upload.updatedAt,
  }));
}

async function listConnectorRecords(workspaceId: string) {
  return (await listConnectorRequests(workspaceId)).map((request) => ({
    id: request.id,
    title: request.displayName,
    connectorType: request.connectorType,
    sourceLocation: request.sourceLocation,
    status: request.status,
    requestedByEmail: request.requestedByEmail,
    note: request.note,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  }));
}

async function getSourceRecord(id: string, workspaceId: string) {
  const source = await getKnowledgeSource(id, workspaceId);

  if (!source) {
    return null;
  }

  return {
    id: source.id,
    title: source.title,
    status: source.status,
    sourceType: source.sourceType,
    uri: source.uri,
    ownerEmail: source.ownerEmail,
    uploadedByEmail: source.uploadedByEmail,
    approvedByEmail: source.approvedByEmail,
    approvedAt: source.approvedAt,
    chunkCount: source.chunkCount,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

async function getSettingsRecord(context: Extract<AdminContext, { state: "ready" }>) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("radar_workspaces")
    .select("*")
    .eq("id", context.workspaceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    id: context.workspaceId,
    workspaceId: context.workspaceId,
    name: (data as { name?: string } | null)?.name ?? "Radar",
    onboardingState: (data as { onboarding_state?: string } | null)?.onboarding_state ?? "admin_setup",
    authEmail: context.authEmail,
    role: context.role,
  };
}

async function listSessionRecords(workspaceId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("radar_sessions")
    .select("id,status,created_by_email,created_at,updated_at,ended_at,tab,capture")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return ((data ?? []) as AdminRecord[]).map((session) => ({
    id: session.id,
    title: toSessionTitle(session),
    status: session.status,
    createdByEmail: session.created_by_email,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
    endedAt: session.ended_at,
    source: session.tab,
    capture: session.capture,
  }));
}

async function getSessionRecord(id: string, workspaceId: string, childPath?: string) {
  const supabase = getSupabaseAdminClient();
  const { data: session, error } = await supabase
    .from("radar_sessions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!session) {
    return null;
  }

  const [segments, cards, feedback, events] = await Promise.all([
    supabase
      .from("radar_transcript_segments")
      .select("*")
      .eq("session_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("radar_guidance_cards")
      .select("*")
      .eq("session_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("radar_card_feedback")
      .select("*")
      .eq("session_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("radar_session_events")
      .select("*")
      .eq("session_id", id)
      .order("sequence", { ascending: true }),
  ]);

  for (const result of [segments, cards, feedback, events]) {
    if (result.error) {
      throw result.error;
    }
  }

  return {
    ...(session as AdminRecord),
    title: toSessionTitle(session as AdminRecord),
    reviewPath: childPath,
    segments: segments.data ?? [],
    cards: cards.data ?? [],
    feedback: feedback.data ?? [],
    events: events.data ?? [],
  };
}

async function listAuditRecords(workspaceId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("radar_audit_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return ((data ?? []) as AdminRecord[]).map((event) => ({
    id: event.id,
    actorEmail: event.actor_email,
    action: event.action,
    targetType: event.target_type,
    targetId: event.target_id,
    metadata: event.metadata,
    createdAt: event.created_at,
  }));
}

function toSessionTitle(session: AdminRecord) {
  const tab = session.tab as { title?: unknown; url?: unknown } | undefined;
  if (typeof tab?.title === "string" && tab.title.trim()) {
    return tab.title;
  }

  if (typeof tab?.url === "string" && tab.url.trim()) {
    return tab.url;
  }

  return `Call ${String(session.id).slice(0, 8)}`;
}
