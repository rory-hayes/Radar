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

const migrationPath = "supabase/migrations/20260703104000_create_assertions_and_test_cases.sql";

test("RAD-022 creates assertion and test-case tables", async () => {
  const migration = await readWorkspaceFile(migrationPath);

  assert.match(migration, /create type public\.assertion_status as enum/);
  assert.match(migration, /create type public\.assertion_priority as enum/);
  assert.match(migration, /create type public\.assertion_category as enum/);
  assert.match(migration, /create type public\.runner_type as enum/);
  assert.match(migration, /create type public\.test_case_status as enum/);
  assert.match(migration, /create type public\.test_case_type as enum/);
  assert.match(migration, /create type public\.assertion_schedule_cadence as enum/);
  assert.match(migration, /create table public\.assertions/);
  assert.match(migration, /create table public\.assertion_sources/);
  assert.match(migration, /create table public\.assertion_templates/);
  assert.match(migration, /create table public\.assertion_runs_schedule/);
  assert.match(migration, /create table public\.test_cases/);
});

test("RAD-022 keeps assertion records workspace-owned and source-linked", async () => {
  const migration = await readWorkspaceFile(migrationPath);

  for (const table of ["assertions", "assertion_sources", "assertion_runs_schedule", "test_cases"]) {
    assert.match(migration, new RegExp(`create table public\\.${table}[\\s\\S]*?workspace_id uuid not null references public\\.workspaces`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }

  assert.match(migration, /source_id uuid not null references public\.sources\(id\) on delete cascade/);
  assert.match(migration, /primary key \(assertion_id, source_id\)/);
  assert.match(migration, /constraint assertion_runs_schedule_assertion_unique unique \(assertion_id\)/);
  assert.match(migration, /constraint assertion_templates_system_workspace_check/);
  assert.match(migration, /constraint test_cases_approval_check/);
});

test("RAD-022 preserves the locked runner and assertion taxonomy", async () => {
  const migration = await readWorkspaceFile(migrationPath);

  assert.match(migration, /'draft'[\s\S]*'active'[\s\S]*'paused'[\s\S]*'archived'/);
  assert.match(migration, /'critical'[\s\S]*'high'[\s\S]*'medium'[\s\S]*'low'/);
  assert.match(migration, /'pricing'[\s\S]*'refund_cancellation'[\s\S]*'trial_onboarding'[\s\S]*'billing_invoices'[\s\S]*'support_escalation'[\s\S]*'custom'/);
  assert.match(migration, /'knowledge'[\s\S]*'journey'[\s\S]*'integration'/);
  assert.match(migration, /'customer_question'[\s\S]*'journey_scenario'[\s\S]*'integration_check'/);
  assert.match(migration, /'manual'[\s\S]*'hourly'[\s\S]*'daily'[\s\S]*'weekly'[\s\S]*'monthly'/);
  assert.doesNotMatch(migration, /prompt_playground|trace_explorer|workflow_canvas|marketplace/i);
});

test("RAD-022 enforces assertion RLS for member reads and editor/admin mutations", async () => {
  const migration = await readWorkspaceFile(migrationPath);

  assert.match(migration, /workspace members can read assertions/);
  assert.match(migration, /workspace editors can create assertions/);
  assert.match(migration, /workspace editors can update assertions/);
  assert.match(migration, /workspace admins can delete assertions/);
  assert.match(migration, /workspace members can read assertion sources/);
  assert.match(migration, /workspace editors can manage assertion sources/);
  assert.match(migration, /workspace members can read assertion templates/);
  assert.match(migration, /workspace editors can manage workspace assertion templates/);
  assert.match(migration, /workspace members can read assertion schedules/);
  assert.match(migration, /workspace editors can manage assertion schedules/);
  assert.match(migration, /workspace members can read test cases/);
  assert.match(migration, /workspace editors can manage test cases/);
  assert.match(migration, /membership\.role in \('admin', 'editor'\)/);
  assert.match(migration, /membership\.role = 'admin'/);
  assert.match(migration, /is_system = true/);
});

test("RAD-022 adds typed assertion validation schemas", async () => {
  await fileExists("src/lib/assertions/schema.ts");

  const schema = await readWorkspaceFile("src/lib/assertions/schema.ts");

  assert.match(schema, /assertionStatuses = \["draft", "active", "paused", "archived"\]/);
  assert.match(schema, /assertionPriorities = \["critical", "high", "medium", "low"\]/);
  assert.match(schema, /runnerTypes = \["knowledge", "journey", "integration"\]/);
  assert.match(schema, /testCaseTypes = \["customer_question", "journey_scenario", "integration_check"\]/);
  assert.match(schema, /assertionScheduleCadences = \["manual", "hourly", "daily", "weekly", "monthly"\]/);
  assert.match(schema, /assertionSourceRelationshipTypes = \["manual", "auto_generated"\]/);
  assert.match(schema, /createAssertionSchema/);
  assert.match(schema, /assertionSourceSchema/);
  assert.match(schema, /assertionTemplateSchema/);
  assert.match(schema, /assertionRunScheduleSchema/);
  assert.match(schema, /testCaseSchema/);
  assert.match(schema, /RadarAssertion/);
  assert.match(schema, /RadarTestCase/);
});

test("RAD-022 documents assertion data boundaries", async () => {
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");
  const security = await readWorkspaceFile("docs/SECURITY.md");
  const demoPolicy = await readWorkspaceFile("docs/DEMO_DATA_POLICY.md");

  assert.match(dataModel, /Assertions and Test Cases/);
  assert.match(dataModel, /assertion_sources/);
  assert.match(dataModel, /assertion_runs_schedule/);
  assert.match(dataModel, /Every assertion and test-case table has `workspace_id` ownership/);
  assert.match(security, /Assertion Data Isolation/);
  assert.match(security, /restricts assertion deletes to active Admin members/);
  assert.match(security, /must not contain runner credentials/);
  assert.match(demoPolicy, /RAD-022 introduces real assertion and test-case tables/);
});
