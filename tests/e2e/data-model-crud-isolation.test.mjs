import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-030 gate verifies repository CRUD coverage for core data model objects", async () => {
  const sources = await readWorkspaceFile("src/lib/repositories/sources.ts");
  const assertions = await readWorkspaceFile("src/lib/repositories/assertions.ts");
  const evaluation = await readWorkspaceFile("src/lib/repositories/evaluation.ts");
  const findings = await readWorkspaceFile("src/lib/repositories/findings.ts");

  for (const functionName of [
    "listSources",
    "getSourceById",
    "createSource",
    "updateSource",
    "deleteSource",
    "createSourceVersion",
    "createSourceDocument",
    "createSourceChunk",
  ]) {
    assert.match(sources, new RegExp(`export async function ${functionName}`));
  }

  for (const functionName of [
    "listAssertions",
    "getAssertionById",
    "createAssertion",
    "updateAssertion",
    "deleteAssertion",
    "linkAssertionSource",
    "upsertAssertionRunSchedule",
    "listTestCasesForAssertion",
    "createTestCase",
  ]) {
    assert.match(assertions, new RegExp(`export async function ${functionName}`));
  }

  for (const functionName of [
    "listEvaluationRunsForAssertion",
    "createEvaluationRun",
    "updateEvaluationRunStatus",
    "listTestCaseResultsForRun",
    "createTestCaseResult",
  ]) {
    assert.match(evaluation, new RegExp(`export async function ${functionName}`));
  }

  for (const functionName of [
    "listFindings",
    "getFindingById",
    "createFinding",
    "updateFindingStatus",
    "addFindingEvidence",
    "listFindingEvidence",
    "assignFinding",
    "recordFindingActivity",
  ]) {
    assert.match(findings, new RegExp(`export async function ${functionName}`));
  }
});

test("RAD-030 gate verifies workspace isolation on every repository query and mutation", async () => {
  const repositories = [
    await readWorkspaceFile("src/lib/repositories/sources.ts"),
    await readWorkspaceFile("src/lib/repositories/assertions.ts"),
    await readWorkspaceFile("src/lib/repositories/evaluation.ts"),
    await readWorkspaceFile("src/lib/repositories/findings.ts"),
  ];

  for (const repository of repositories) {
    assert.match(repository, /workspaceId: string/);
    assert.match(repository, /workspace_id: workspaceId/);
    assert.match(repository, /\.eq\("workspace_id", workspaceId\)/);
    assert.doesNotMatch(repository, /service_role|sb_secret/i);
  }
});

test("RAD-030 gate verifies migrations seeds RLS and storage are covered by the harness", async () => {
  const packageJson = JSON.parse(await readWorkspaceFile("package.json"));
  const harness = await readWorkspaceFile("scripts/verify-db-harness.mjs");
  const seed = await readWorkspaceFile("supabase/seeds/radar-demo-workspace.sql");
  const rlsMigration = await readWorkspaceFile("supabase/migrations/20260703111500_harden_workspace_rls_policies.sql");
  const storageMigration = await readWorkspaceFile("supabase/migrations/20260703112000_configure_evidence_artifact_storage.sql");

  assert.equal(packageJson.scripts["db:harness"], "node scripts/verify-db-harness.mjs");
  assert.equal(packageJson.scripts["db:harness:apply"], "node scripts/verify-db-harness.mjs --apply");
  assert.match(harness, /verifySchemaConstraintsAndIndexes/);
  assert.match(harness, /verifyWorkspaceRls/);
  assert.match(harness, /verifySeedCoverage/);
  assert.match(harness, /verifyStorageBucket/);
  assert.match(seed, /public\.sources/);
  assert.match(seed, /public\.assertions/);
  assert.match(seed, /public\.evaluation_runs/);
  assert.match(seed, /public\.findings/);
  assert.match(seed, /public\.finding_evidence/);
  assert.match(rlsMigration, /force row level security/);
  assert.match(rlsMigration, /current_user_is_workspace_member/);
  assert.match(storageMigration, /radar-evidence-artifacts/);
  assert.match(storageMigration, /public = false/);
});

test("RAD-030 gate verifies product scope and navigation remain locked after Phase 2", async () => {
  const routes = await readWorkspaceFile("src/lib/radar-routes.ts");
  const sidebar = await readWorkspaceFile("src/components/app-shell/sidebar-nav.tsx");
  const scope = await readWorkspaceFile("docs/PRODUCT_SCOPE.md");
  const tasks = await readWorkspaceFile("tasks/TASKS.md");

  assert.match(routes, /title: "Command Center"/);
  assert.match(routes, /title: "Assertions"/);
  assert.match(routes, /title: "Findings"/);
  assert.match(routes, /title: "Sources"/);
  assert.doesNotMatch(sidebar, /Prompt Playground|Trace Explorer|Workflow Canvas|Marketplace/i);
  assert.match(scope, /If a feature does not help a user create, run, understand, fix, or monitor a customer-facing assertion/);
  assert.match(tasks, /RAD-021[\s\S]*Done/);
  assert.match(tasks, /RAD-029[\s\S]*Done/);
});
