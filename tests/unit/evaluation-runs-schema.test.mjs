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

const migrationPath = "supabase/migrations/20260703105000_create_evaluation_runs_and_results.sql";

test("RAD-023 creates evaluation run and test case result tables", async () => {
  const migration = await readWorkspaceFile(migrationPath);

  assert.match(migration, /create type public\.evaluation_run_status as enum/);
  assert.match(migration, /create type public\.test_case_result_status as enum/);
  assert.match(migration, /create type public\.evaluation_run_trigger as enum/);
  assert.match(migration, /create table public\.evaluation_runs/);
  assert.match(migration, /create table public\.test_case_results/);
  assert.match(migration, /runner_type public\.runner_type not null/);
});

test("RAD-023 keeps runs and results workspace-owned with scoped foreign keys", async () => {
  const migration = await readWorkspaceFile(migrationPath);

  for (const table of ["evaluation_runs", "test_case_results"]) {
    assert.match(migration, new RegExp(`create table public\\.${table}[\\s\\S]*?workspace_id uuid not null references public\\.workspaces`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }

  assert.match(migration, /assertions_workspace_id_id_unique unique \(workspace_id, id\)/);
  assert.match(migration, /test_cases_workspace_id_id_unique unique \(workspace_id, id\)/);
  assert.match(migration, /evaluation_runs_workspace_assertion_fk foreign key \(workspace_id, assertion_id\)/);
  assert.match(migration, /test_case_results_workspace_run_fk foreign key \(workspace_id, evaluation_run_id\)/);
  assert.match(migration, /test_case_results_workspace_test_case_fk foreign key \(workspace_id, test_case_id\)/);
  assert.match(migration, /test_case_results_run_case_unique unique \(evaluation_run_id, test_case_id\)/);
});

test("RAD-023 stores scores confidence evidence refs and execution metadata", async () => {
  const migration = await readWorkspaceFile(migrationPath);

  assert.match(migration, /'queued'[\s\S]*'running'[\s\S]*'passed'[\s\S]*'warning'[\s\S]*'failed'[\s\S]*'inconclusive'[\s\S]*'error'[\s\S]*'canceled'/);
  assert.match(migration, /'manual'[\s\S]*'schedule'[\s\S]*'source_change'[\s\S]*'system'/);
  assert.match(migration, /'passed'[\s\S]*'warning'[\s\S]*'failed'[\s\S]*'inconclusive'[\s\S]*'error'[\s\S]*'skipped'/);
  assert.match(migration, /score numeric\(5, 4\)/);
  assert.match(migration, /confidence numeric\(5, 4\)/);
  assert.match(migration, /evidence_refs jsonb not null default '\[\]'::jsonb/);
  assert.match(migration, /execution_metadata jsonb not null default '\{\}'::jsonb/);
  assert.match(migration, /evaluation_runs_score_range/);
  assert.match(migration, /test_case_results_confidence_range/);
  assert.doesNotMatch(migration, /prompt_playground|trace_explorer|workflow_canvas|marketplace/i);
});

test("RAD-023 enforces run RLS for member reads editor writes and admin deletes", async () => {
  const migration = await readWorkspaceFile(migrationPath);

  assert.match(migration, /workspace members can read evaluation runs/);
  assert.match(migration, /workspace editors can create evaluation runs/);
  assert.match(migration, /workspace editors can update evaluation runs/);
  assert.match(migration, /workspace admins can delete evaluation runs/);
  assert.match(migration, /workspace members can read test case results/);
  assert.match(migration, /workspace editors can create test case results/);
  assert.match(migration, /workspace editors can update test case results/);
  assert.match(migration, /workspace admins can delete test case results/);
  assert.match(migration, /membership\.role in \('admin', 'editor'\)/);
  assert.match(migration, /membership\.role = 'admin'/);
});

test("RAD-023 adds typed evaluation validation schemas", async () => {
  await fileExists("src/lib/evaluation/schema.ts");

  const schema = await readWorkspaceFile("src/lib/evaluation/schema.ts");

  assert.match(schema, /evaluationRunStatuses = \[/);
  assert.match(schema, /"queued"/);
  assert.match(schema, /"failed"/);
  assert.match(schema, /testCaseResultStatuses = \["passed", "warning", "failed", "inconclusive", "error", "skipped"\]/);
  assert.match(schema, /evaluationRunTriggerTypes = \["manual", "schedule", "source_change", "system"\]/);
  assert.match(schema, /evaluationEvidenceRefSchema/);
  assert.match(schema, /evaluationRunSchema/);
  assert.match(schema, /testCaseResultSchema/);
  assert.match(schema, /RadarEvaluationRun/);
  assert.match(schema, /RadarTestCaseResult/);
});

test("RAD-023 documents evaluation run data boundaries", async () => {
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");
  const security = await readWorkspaceFile("docs/SECURITY.md");
  const demoPolicy = await readWorkspaceFile("docs/DEMO_DATA_POLICY.md");

  assert.match(dataModel, /Evaluation Runs and Results/);
  assert.match(dataModel, /evaluation_runs/);
  assert.match(dataModel, /test_case_results/);
  assert.match(dataModel, /must not duplicate raw documents or runner secrets/);
  assert.match(security, /Evaluation Run Data Isolation/);
  assert.match(security, /restricts deletes to active Admin members/);
  assert.match(security, /must not store runner credentials/);
  assert.match(demoPolicy, /RAD-023 introduces real evaluation run history/);
});
