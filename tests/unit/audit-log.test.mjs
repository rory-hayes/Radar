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

test("RAD-016 creates audit log schema with scoped RLS", async () => {
  const migration = await readWorkspaceFile("supabase/migrations/20260703100000_create_audit_logs.sql");

  assert.match(migration, /create type public\.audit_action as enum/);
  assert.match(migration, /create table public\.audit_logs/);
  assert.match(migration, /workspace_id uuid references public\.workspaces\(id\) on delete cascade/);
  assert.match(migration, /actor_user_id uuid references auth\.users\(id\) on delete set null/);
  assert.match(migration, /metadata jsonb not null default '\{\}'::jsonb/);
  assert.match(migration, /alter table public\.audit_logs enable row level security/);
  assert.match(migration, /workspace members can read workspace audit logs/);
  assert.match(migration, /actors can read their own auth audit logs/);
  assert.match(migration, /authenticated users can write scoped audit logs/);
});

test("RAD-016 defines initial audit event families", async () => {
  const actions = await readWorkspaceFile("src/lib/audit/actions.ts");

  for (const action of [
    "auth.signed_in",
    "auth.signed_out",
    "workspace.created",
    "workspace.updated",
    "source.created",
    "assertion.created",
    "run.rerun_requested",
    "finding.resolved",
  ]) {
    assert.match(actions, new RegExp(`"${action.replace(".", "\\.")}"`));
  }

  assert.match(actions, /auditResourceTypes/);
  assert.match(actions, /"auth_session"/);
  assert.match(actions, /"workspace"/);
  assert.match(actions, /"source"/);
  assert.match(actions, /"assertion"/);
  assert.match(actions, /"run"/);
  assert.match(actions, /"finding"/);
});

test("RAD-016 adds a server-only audit writer", async () => {
  await fileExists("src/lib/audit/server.ts");

  const writer = await readWorkspaceFile("src/lib/audit/server.ts");

  assert.match(writer, /server-only/);
  assert.match(writer, /recordAuditEvent/);
  assert.match(writer, /auditEventSchema/);
  assert.match(writer, /getAuthenticatedUser/);
  assert.match(writer, /createSupabaseServerClient/);
  assert.match(writer, /\.from\("audit_logs"\)\.insert/);
  assert.match(writer, /workspace_id: event\.workspaceId/);
  assert.match(writer, /actor_user_id: user\.id/);
});

test("RAD-016 wires initial auth and workspace audit events", async () => {
  const callback = await readWorkspaceFile("src/app/auth/callback/route.ts");
  const signOut = await readWorkspaceFile("src/app/auth/sign-out/route.ts");
  const workspaceServer = await readWorkspaceFile("src/lib/workspaces/server.ts");

  assert.match(callback, /recordAuditEvent/);
  assert.match(callback, /auth\.signed_in/);
  assert.match(signOut, /recordAuditEvent/);
  assert.match(signOut, /auth\.signed_out/);
  assert.match(workspaceServer, /workspace\.created/);
  assert.match(workspaceServer, /workspace\.updated/);
  assert.match(workspaceServer, /changedFields/);
});

test("RAD-016 documents audit logging security boundaries", async () => {
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");
  const security = await readWorkspaceFile("docs/SECURITY.md");

  assert.match(dataModel, /Audit logs/);
  assert.match(dataModel, /auth, workspace, source, assertion, run, and finding changes/);
  assert.match(security, /Audit Logging/);
  assert.match(security, /recordAuditEvent/);
  assert.match(security, /must not include raw source content/);
  assert.match(security, /runner credentials/);
});
