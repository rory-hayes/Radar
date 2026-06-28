import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { ensureWorkspace, getWorkspaceId } from "@/lib/workspace/store";

export type ConnectorType =
  | "google_drive"
  | "confluence_jira"
  | "notion"
  | "support_crm"
  | "other";

export type ConnectorRequestStatus =
  | "requested"
  | "scoping"
  | "ready_to_wire"
  | "connected"
  | "blocked";

export type ConnectorRequest = {
  id: string;
  workspaceId: string;
  connectorType: ConnectorType;
  displayName: string;
  sourceLocation?: string;
  status: ConnectorRequestStatus;
  requestedByEmail: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

type ConnectorRequestRow = {
  id: string;
  workspace_id: string;
  connector_type: ConnectorType;
  display_name: string;
  source_location: string | null;
  status: ConnectorRequestStatus;
  requested_by_email: string;
  metadata: {
    note?: unknown;
  } | null;
  created_at: string;
  updated_at: string;
};

export async function createConnectorRequest(input: {
  workspaceId?: string;
  connectorType: ConnectorType;
  displayName: string;
  sourceLocation?: string;
  note?: string;
  requestedByEmail: string;
}) {
  const workspaceId = getWorkspaceId(input.workspaceId);
  await ensureWorkspace(workspaceId);

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("radar_connector_requests")
    .insert({
      workspace_id: workspaceId,
      connector_type: input.connectorType,
      display_name: input.displayName,
      source_location: input.sourceLocation || null,
      requested_by_email: input.requestedByEmail,
      metadata: {
        note: input.note || undefined,
      },
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return toConnectorRequest(data as ConnectorRequestRow);
}

export async function listConnectorRequests(workspaceId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("radar_connector_requests")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ConnectorRequestRow[]).map(toConnectorRequest);
}

function toConnectorRequest(row: ConnectorRequestRow): ConnectorRequest {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    connectorType: row.connector_type,
    displayName: row.display_name,
    sourceLocation: row.source_location ?? undefined,
    status: row.status,
    requestedByEmail: row.requested_by_email,
    note: typeof row.metadata?.note === "string" ? row.metadata.note : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
