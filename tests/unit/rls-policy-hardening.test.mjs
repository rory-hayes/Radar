import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260703111500_harden_workspace_rls_policies.sql";

async function fileExists(relativePath) {
  await access(relativePath);
  return true;
}

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-027 adds security-definer workspace membership helpers", async () => {
  await fileExists(migrationPath);

  const migration = await readWorkspaceFile(migrationPath);

  assert.match(migration, /current_user_has_workspace_role/);
  assert.match(migration, /current_user_is_workspace_member/);
  assert.match(migration, /current_user_can_edit_workspace/);
  assert.match(migration, /current_user_is_workspace_admin/);
  assert.match(migration, /security definer/);
  assert.match(migration, /set search_path = public/);
  assert.match(migration, /revoke all on function public\.current_user_has_workspace_role/);
  assert.match(migration, /grant execute on function public\.current_user_is_workspace_admin\(uuid\) to authenticated/);
});

test("RAD-027 forces RLS on every workspace-owned product table", async () => {
  const migration = await readWorkspaceFile(migrationPath);

  for (const table of [
    "workspaces",
    "workspace_members",
    "audit_logs",
    "sources",
    "source_versions",
    "source_documents",
    "source_chunks",
    "assertions",
    "assertion_sources",
    "assertion_templates",
    "assertion_runs_schedule",
    "test_cases",
    "evaluation_runs",
    "test_case_results",
    "findings",
    "finding_evidence",
    "finding_assignments",
    "finding_activity",
  ]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} force row level security`));
  }
});

test("RAD-027 replaces direct product policies with shared workspace role checks", async () => {
  const migration = await readWorkspaceFile(migrationPath);

  assert.match(migration, /drop policy if exists "workspace members can read sources"/);
  assert.match(migration, /using \(public\.current_user_is_workspace_member\(sources\.workspace_id\)\)/);
  assert.match(migration, /with check \(\s*created_by = auth\.uid\(\)\s*and public\.current_user_can_edit_workspace\(assertions\.workspace_id\)/);
  assert.match(migration, /using \(public\.current_user_is_workspace_admin\(evaluation_runs\.workspace_id\)\)/);
  assert.match(migration, /using \(public\.current_user_can_edit_workspace\(finding_assignments\.workspace_id\)\)/);
  assert.match(migration, /workspace editors can create test cases/);
  assert.match(migration, /workspace editors can update test cases/);
  assert.match(migration, /workspace editors can delete test cases/);
});

test("RAD-027 scopes storage artifact policies by workspace path and role", async () => {
  const migration = await readWorkspaceFile(migrationPath);

  assert.match(migration, /storage_object_workspace_id/);
  assert.match(migration, /to_regclass\('storage\.objects'\)/);
  assert.match(migration, /bucket_id = 'radar-evidence-artifacts'/);
  assert.match(migration, /workspace members can read evidence artifacts/);
  assert.match(migration, /workspace editors can create evidence artifacts/);
  assert.match(migration, /workspace editors can update evidence artifacts/);
  assert.match(migration, /workspace admins can delete evidence artifacts/);
  assert.match(migration, /public\.current_user_is_workspace_member\(public\.storage_object_workspace_id\(name\)\)/);
  assert.match(migration, /public\.current_user_can_edit_workspace\(public\.storage_object_workspace_id\(name\)\)/);
  assert.match(migration, /public\.current_user_is_workspace_admin\(public\.storage_object_workspace_id\(name\)\)/);
});

test("RAD-027 documents database-level RLS hardening", async () => {
  const security = await readWorkspaceFile("docs/SECURITY.md");
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");

  assert.match(security, /RLS Policy Hardening/);
  assert.match(security, /security-definer workspace membership helpers/);
  assert.match(security, /storage object policies/);
  assert.match(dataModel, /RLS hardening/);
});
