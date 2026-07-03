import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function fileExists(relativePath) {
  await access(relativePath);
  return true;
}

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

const migrationPath = "supabase/migrations/20260703110000_create_findings_and_evidence.sql";

test("RAD-024 creates findings evidence activity and assignment tables", async () => {
  const migration = await readWorkspaceFile(migrationPath);

  assert.match(migration, /create type public\.finding_status as enum/);
  assert.match(migration, /create type public\.finding_severity as enum/);
  assert.match(migration, /create type public\.finding_evidence_type as enum/);
  assert.match(migration, /create type public\.finding_activity_type as enum/);
  assert.match(migration, /create table public\.findings/);
  assert.match(migration, /create table public\.finding_evidence/);
  assert.match(migration, /create table public\.finding_assignments/);
  assert.match(migration, /create table public\.finding_activity/);
});

test("RAD-024 keeps findings workspace-owned and linked to assertions runs and sources", async () => {
  const migration = await readWorkspaceFile(migrationPath);

  for (const table of ["findings", "finding_evidence", "finding_assignments", "finding_activity"]) {
    assert.match(migration, new RegExp(`create table public\\.${table}[\\s\\S]*?workspace_id uuid not null references public\\.workspaces`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }

  assert.match(migration, /findings_workspace_assertion_fk foreign key \(workspace_id, assertion_id\)/);
  assert.match(migration, /findings_workspace_run_fk foreign key \(workspace_id, evaluation_run_id\)/);
  assert.match(migration, /findings_workspace_result_fk foreign key \(workspace_id, test_case_result_id\)/);
  assert.match(migration, /finding_evidence_workspace_source_fk foreign key \(workspace_id, source_id\)/);
  assert.match(migration, /finding_evidence_workspace_chunk_fk foreign key \(workspace_id, source_chunk_id\)/);
  assert.match(migration, /finding_assignments_active_unique_idx/);
  assert.match(migration, /findings_workspace_dedupe_unique unique \(workspace_id, dedupe_key\)/);
});

test("RAD-024 stores lifecycle severity evidence and resolution fields", async () => {
  const migration = await readWorkspaceFile(migrationPath);

  assert.match(migration, /'open'[\s\S]*'investigating'[\s\S]*'fixed'[\s\S]*'resolved'[\s\S]*'ignored'[\s\S]*'false_positive'/);
  assert.match(migration, /'critical'[\s\S]*'high'[\s\S]*'medium'[\s\S]*'low'/);
  assert.match(migration, /'source_chunk'[\s\S]*'source_document'[\s\S]*'run_output'[\s\S]*'artifact'[\s\S]*'manual_note'/);
  assert.match(migration, /expected text not null/);
  assert.match(migration, /actual text not null/);
  assert.match(migration, /customer_impact text not null/);
  assert.match(migration, /recommended_fix text not null/);
  assert.match(migration, /resolved_at timestamptz/);
  assert.match(migration, /resolution_summary text/);
  assert.match(migration, /findings_resolution_check/);
  assert.doesNotMatch(migration, /prompt_playground|trace_explorer|workflow_canvas|marketplace/i);
});

test("RAD-024 enforces finding RLS for member reads editor writes and admin deletes", async () => {
  const migration = await readWorkspaceFile(migrationPath);

  assert.match(migration, /workspace members can read findings/);
  assert.match(migration, /workspace editors can create findings/);
  assert.match(migration, /workspace editors can update findings/);
  assert.match(migration, /workspace admins can delete findings/);
  assert.match(migration, /workspace members can read finding evidence/);
  assert.match(migration, /workspace editors can manage finding evidence/);
  assert.match(migration, /workspace members can read finding assignments/);
  assert.match(migration, /workspace editors can manage finding assignments/);
  assert.match(migration, /workspace members can read finding activity/);
  assert.match(migration, /workspace editors can create finding activity/);
  assert.match(migration, /membership\.role in \('admin', 'editor'\)/);
  assert.match(migration, /membership\.role = 'admin'/);
});

test("RAD-024 adds typed finding validation schemas", async () => {
  await fileExists("src/lib/findings/schema.ts");

  const schema = await readWorkspaceFile("src/lib/findings/schema.ts");

  assert.match(schema, /findingStatuses = \["open", "investigating", "fixed", "resolved", "ignored", "false_positive"\]/);
  assert.match(schema, /findingSeverities = \["critical", "high", "medium", "low"\]/);
  assert.match(schema, /findingEvidenceTypes = \["source_chunk", "source_document", "run_output", "artifact", "manual_note"\]/);
  assert.match(schema, /findingSchema/);
  assert.match(schema, /findingEvidenceSchema/);
  assert.match(schema, /findingAssignmentSchema/);
  assert.match(schema, /findingActivitySchema/);
  assert.match(schema, /RadarFinding/);
  assert.match(schema, /RadarFindingEvidence/);
});

test("RAD-024 documents finding data boundaries", async () => {
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");
  const security = await readWorkspaceFile("docs/SECURITY.md");
  const demoPolicy = await readWorkspaceFile("docs/DEMO_DATA_POLICY.md");

  assert.match(dataModel, /Findings and Evidence/);
  assert.match(dataModel, /finding_evidence/);
  assert.match(dataModel, /finding_assignments/);
  assert.match(dataModel, /must not copy full source documents or raw runner secrets/);
  assert.match(security, /Finding Data Isolation/);
  assert.match(security, /restricts finding deletes to active Admin members/);
  assert.match(security, /must not include runner credentials/);
  assert.match(demoPolicy, /RAD-024 introduces real finding issue tables/);
});
