import "server-only";

import { listRunnerCredentials, type RadarRepositoryClient } from "@/lib/repositories";
import { assertRepositorySuccess, requireRepositoryRow, type JsonRecord } from "@/lib/repositories/client";
import { type RadarWorkspace } from "@/lib/workspaces/schema";

type ExportRow = JsonRecord;

type WorkspaceExportTable =
  | "workspaceMembers"
  | "auditLogs"
  | "sources"
  | "sourceVersions"
  | "sourceDocuments"
  | "sourceChunks"
  | "assertions"
  | "assertionSources"
  | "assertionRunSchedules"
  | "testCases"
  | "evaluationRuns"
  | "testCaseResults"
  | "findings"
  | "findingEvidence"
  | "findingAssignments"
  | "findingActivity"
  | "notificationDeliveries"
  | "abuseLimitEvents";

type ExportTableDefinition = {
  key: WorkspaceExportTable;
  table: string;
  columns: string;
  orderColumn?: string;
};

export type WorkspaceExportPayload = {
  schemaVersion: "radar.workspace-export.v1";
  exportedAt: string;
  workspaceId: string;
  retention: {
    dataRetentionDays: number;
    olderThan: string;
  };
  redactions: string[];
  workspace: ExportRow;
  tables: Record<WorkspaceExportTable, ExportRow[]>;
  billing: ExportRow | null;
  runnerCredentials: ExportRow[];
  artifactManifest: {
    storagePath: string;
    source: "source_document" | "finding_evidence";
  }[];
  counts: Record<string, number>;
};

const exportTableDefinitions: readonly ExportTableDefinition[] = [
  {
    key: "workspaceMembers",
    table: "workspace_members",
    columns: "workspace_id, user_id, role, status, invited_by, joined_at, created_at, updated_at",
  },
  {
    key: "auditLogs",
    table: "audit_logs",
    columns: "id, workspace_id, actor_user_id, action, resource_type, resource_id, metadata, created_at",
  },
  {
    key: "sources",
    table: "sources",
    columns:
      "id, workspace_id, name, description, type, sync_status, origin_uri, content_hash, last_synced_at, last_sync_error, created_by, config, metadata, created_at, updated_at",
  },
  {
    key: "sourceVersions",
    table: "source_versions",
    columns:
      "id, workspace_id, source_id, version_number, sync_status, content_hash, document_count, chunk_count, sync_started_at, sync_completed_at, sync_error, metadata, created_at, updated_at",
  },
  {
    key: "sourceDocuments",
    table: "source_documents",
    columns:
      "id, workspace_id, source_id, source_version_id, title, document_uri, mime_type, storage_path, status, content_hash, byte_size, extracted_at, extraction_error, metadata, created_at, updated_at",
  },
  {
    key: "sourceChunks",
    table: "source_chunks",
    columns:
      "id, workspace_id, source_id, source_document_id, chunk_index, content, content_hash, token_count, metadata, created_at",
  },
  {
    key: "assertions",
    table: "assertions",
    columns:
      "id, workspace_id, title, purpose, expected_behavior, category, priority, runner_type, status, owner_user_id, created_by, metadata, created_at, updated_at",
  },
  {
    key: "assertionSources",
    table: "assertion_sources",
    columns: "workspace_id, assertion_id, source_id, is_required, relationship_type, purpose, created_at",
  },
  {
    key: "assertionRunSchedules",
    table: "assertion_runs_schedule",
    columns:
      "id, workspace_id, assertion_id, cadence, timezone, source_change_trigger, is_enabled, next_run_at, last_scheduled_at, metadata, created_at, updated_at",
  },
  {
    key: "testCases",
    table: "test_cases",
    columns:
      "id, workspace_id, assertion_id, title, type, status, input, expected_result, ordinal, created_by, approved_by, approved_at, metadata, created_at, updated_at",
  },
  {
    key: "evaluationRuns",
    table: "evaluation_runs",
    columns:
      "id, workspace_id, assertion_id, runner_type, status, trigger_type, triggered_by_user_id, scheduled_for, started_at, completed_at, duration_ms, total_test_cases, passed_count, warning_count, failed_count, error_count, skipped_count, score, confidence, evidence_refs, execution_metadata, error_message, created_at, updated_at",
  },
  {
    key: "testCaseResults",
    table: "test_case_results",
    columns:
      "id, workspace_id, evaluation_run_id, assertion_id, test_case_id, runner_type, status, score, confidence, actual_output, actual_summary, evaluator_summary, evidence_refs, execution_metadata, error_message, started_at, completed_at, duration_ms, created_at, updated_at",
  },
  {
    key: "findings",
    table: "findings",
    columns:
      "id, workspace_id, assertion_id, evaluation_run_id, test_case_result_id, title, summary, expected, actual, severity, status, confidence, customer_impact, recommended_fix, owner_user_id, dedupe_key, first_seen_at, last_seen_at, resolved_at, resolved_by_user_id, resolution_summary, ignored_until, metadata, created_at, updated_at",
  },
  {
    key: "findingEvidence",
    table: "finding_evidence",
    columns:
      "id, workspace_id, finding_id, evidence_type, source_id, source_document_id, source_chunk_id, evaluation_run_id, test_case_result_id, quote, artifact_path, citation, confidence, metadata, created_at",
  },
  {
    key: "findingAssignments",
    table: "finding_assignments",
    columns:
      "id, workspace_id, finding_id, assignee_user_id, assigned_by_user_id, note, assigned_at, unassigned_at, metadata",
    orderColumn: "assigned_at",
  },
  {
    key: "findingActivity",
    table: "finding_activity",
    columns:
      "id, workspace_id, finding_id, actor_user_id, activity_type, from_status, to_status, from_assignee_user_id, to_assignee_user_id, note, metadata, created_at",
  },
  {
    key: "notificationDeliveries",
    table: "notification_deliveries",
    columns:
      "id, workspace_id, notification_type, channel, recipient_email, subject, status, provider, error_message, resource_type, resource_id, metadata, sent_at, created_at, updated_at",
  },
  {
    key: "abuseLimitEvents",
    table: "abuse_limit_events",
    columns: "id, workspace_id, user_id, event_type, quantity, metadata, created_at",
  },
];

export async function buildWorkspaceExportPayload(
  client: RadarRepositoryClient,
  workspace: RadarWorkspace,
): Promise<WorkspaceExportPayload> {
  const exportedAt = new Date().toISOString();
  const [workspaceRow, billing, runnerCredentials, tableEntries] = await Promise.all([
    getWorkspaceExportRow(client, workspace.id),
    getBillingExportRow(client, workspace.id),
    listRunnerCredentials(client, workspace.id),
    Promise.all(
      exportTableDefinitions.map(async (definition) => [
        definition.key,
        await listWorkspaceTableRows(client, workspace.id, definition),
      ] as const),
    ),
  ]);
  const tables = Object.fromEntries(tableEntries) as Record<WorkspaceExportTable, ExportRow[]>;
  const artifactManifest = buildArtifactManifest(tables);

  return {
    schemaVersion: "radar.workspace-export.v1",
    exportedAt,
    workspaceId: workspace.id,
    retention: {
      dataRetentionDays: workspace.dataRetentionDays,
      olderThan: retentionCutoff(exportedAt, workspace.dataRetentionDays),
    },
    redactions: [
      "Runner credential encrypted values are excluded.",
      "Stripe customer, subscription, and price identifiers are excluded.",
      "Provider message ids, preferences URLs, and unsubscribe URLs are excluded.",
      "Private artifact storage paths are listed without signed download URLs.",
    ],
    workspace: workspaceRow,
    tables,
    billing,
    runnerCredentials: runnerCredentials.map((credential) => ({
      id: credential.id,
      workspace_id: credential.workspaceId,
      name: credential.name,
      credential_type: credential.credentialType,
      redaction_label: credential.redactionLabel,
      last_tested_at: credential.lastTestedAt,
      last_test_status: credential.lastTestStatus,
      last_test_error: credential.lastTestError,
      created_by: credential.createdBy,
      metadata: credential.metadata,
    })),
    artifactManifest,
    counts: {
      ...Object.fromEntries(Object.entries(tables).map(([key, rows]) => [key, rows.length])),
      billing: billing ? 1 : 0,
      runnerCredentials: runnerCredentials.length,
      artifactManifest: artifactManifest.length,
    },
  };
}

function retentionCutoff(exportedAt: string, days: number) {
  const cutoff = new Date(exportedAt);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff.toISOString();
}

async function getWorkspaceExportRow(client: RadarRepositoryClient, workspaceId: string) {
  const { data, error } = await client
    .from("workspaces")
    .select("id, name, slug, status, team_visibility, data_retention_days, data_retention_updated_at, created_at, updated_at")
    .eq("id", workspaceId)
    .single<ExportRow>();

  assertRepositorySuccess(error, "Unable to export workspace");
  return requireRepositoryRow(data, "Workspace export returned no row");
}

async function getBillingExportRow(client: RadarRepositoryClient, workspaceId: string) {
  const { data, error } = await client
    .from("billing_customers")
    .select(
      "id, workspace_id, plan, subscription_status, billing_email, current_period_end, cancel_at_period_end, unpaid_since, metadata, created_at, updated_at",
    )
    .eq("workspace_id", workspaceId)
    .maybeSingle<ExportRow>();

  assertRepositorySuccess(error, "Unable to export billing summary");
  return data ?? null;
}

async function listWorkspaceTableRows(
  client: RadarRepositoryClient,
  workspaceId: string,
  definition: ExportTableDefinition,
) {
  const { data, error } = await client
    .from(definition.table)
    .select(definition.columns)
    .eq("workspace_id", workspaceId)
    .order(definition.orderColumn ?? "created_at", { ascending: true })
    .returns<ExportRow[]>();

  assertRepositorySuccess(error, `Unable to export ${definition.table}`);
  return data ?? [];
}

function buildArtifactManifest(tables: Record<WorkspaceExportTable, ExportRow[]>) {
  const manifest = new Map<string, "source_document" | "finding_evidence">();

  for (const row of tables.sourceDocuments) {
    addArtifactPath(manifest, row.storage_path, "source_document");
  }

  for (const row of tables.findingEvidence) {
    addArtifactPath(manifest, row.artifact_path, "finding_evidence");
  }

  return [...manifest.entries()].map(([storagePath, source]) => ({ storagePath, source }));
}

function addArtifactPath(
  manifest: Map<string, "source_document" | "finding_evidence">,
  storagePath: unknown,
  source: "source_document" | "finding_evidence",
) {
  if (typeof storagePath === "string" && storagePath.length > 0) {
    manifest.set(storagePath, manifest.get(storagePath) ?? source);
  }
}
