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

test("RAD-012 creates workspace and membership database primitives", async () => {
  const migration = await readWorkspaceFile("supabase/migrations/20260703090000_create_workspaces_and_memberships.sql");

  assert.match(migration, /create table public\.workspaces/);
  assert.match(migration, /create table public\.workspace_members/);
  assert.match(migration, /workspace_member_role as enum \('admin', 'editor', 'viewer'\)/);
  assert.match(migration, /primary key \(workspace_id, user_id\)/);
  assert.match(migration, /workspace_id uuid not null references public\.workspaces\(id\) on delete cascade/);
  assert.match(migration, /created_by uuid not null references auth\.users\(id\)/);
});

test("RAD-012 enforces workspace access with initial RLS and transactional creation", async () => {
  const migration = await readWorkspaceFile("supabase/migrations/20260703090000_create_workspaces_and_memberships.sql");

  assert.match(migration, /alter table public\.workspaces enable row level security/);
  assert.match(migration, /alter table public\.workspace_members enable row level security/);
  assert.match(migration, /workspace members can read their workspaces/);
  assert.match(migration, /created_by = auth\.uid\(\)/);
  assert.match(migration, /workspace creators can add themselves as admin/);
  assert.match(migration, /create or replace function public\.create_workspace_with_admin_membership/);
  assert.match(migration, /security invoker/);
  assert.match(migration, /grant execute on function public\.create_workspace_with_admin_membership\(text, text\) to authenticated/);
});

test("RAD-012 adds typed workspace helpers and slug validation", async () => {
  for (const helperPath of ["src/lib/workspaces/schema.ts", "src/lib/workspaces/server.ts"]) {
    await fileExists(helperPath);
  }

  const schema = await readWorkspaceFile("src/lib/workspaces/schema.ts");
  const server = await readWorkspaceFile("src/lib/workspaces/server.ts");

  assert.match(schema, /createWorkspaceSchema/);
  assert.match(schema, /createWorkspaceSlug/);
  assert.match(schema, /replace\(\/\[\^a-z0-9\]\+\/g, "-"\)/);
  assert.match(server, /getActiveWorkspaceForCurrentUser/);
  assert.match(server, /requireActiveWorkspace/);
  assert.match(server, /createWorkspaceForCurrentUser/);
  assert.match(server, /supabase\.rpc\("create_workspace_with_admin_membership"/);
});

test("RAD-012 adds an authenticated first-workspace creation flow", async () => {
  for (const routePath of [
    "src/app/(workspace)/layout.tsx",
    "src/app/(workspace)/workspace/new/actions.ts",
    "src/app/(workspace)/workspace/new/page.tsx",
    "src/components/workspaces/workspace-create-form.tsx",
  ]) {
    await fileExists(routePath);
  }

  const appLayout = await readWorkspaceFile("src/app/(app)/layout.tsx");
  const workspaceLayout = await readWorkspaceFile("src/app/(workspace)/layout.tsx");
  const action = await readWorkspaceFile("src/app/(workspace)/workspace/new/actions.ts");
  const form = await readWorkspaceFile("src/components/workspaces/workspace-create-form.tsx");
  const redirects = await readWorkspaceFile("src/lib/auth/redirects.ts");

  assert.match(appLayout, /requireActiveWorkspace\(\)/);
  assert.match(appLayout, /workspace=\{membership\.workspace\}/);
  assert.match(workspaceLayout, /requireAuthenticatedUser\(\)/);
  assert.match(action, /createWorkspaceForCurrentUser/);
  assert.match(action, /redirect\("\/command-center"\)/);
  assert.match(form, /useActionState/);
  assert.match(form, /Workspace name/);
  assert.match(redirects, /"\/workspace"/);
});
