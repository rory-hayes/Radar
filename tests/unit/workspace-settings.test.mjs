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

test("RAD-015 adds persistent workspace settings fields and update RLS", async () => {
  const migration = await readWorkspaceFile("supabase/migrations/20260703093000_add_workspace_settings_fields.sql");

  assert.match(migration, /create type public\.workspace_team_visibility as enum \('private', 'workspace'\)/);
  assert.match(migration, /add column team_visibility public\.workspace_team_visibility not null default 'private'/);
  assert.match(migration, /workspace admins can update workspace profile/);
  assert.match(migration, /for update/);
  assert.match(migration, /membership\.role = 'admin'/);
  assert.match(migration, /membership\.status = 'active'/);
});

test("RAD-015 exposes typed workspace settings validation and update helper", async () => {
  const schema = await readWorkspaceFile("src/lib/workspaces/schema.ts");
  const server = await readWorkspaceFile("src/lib/workspaces/server.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/workspaces.ts");

  assert.match(schema, /workspaceTeamVisibilities = \["private", "workspace"\]/);
  assert.match(schema, /updateWorkspaceSettingsSchema/);
  assert.match(schema, /teamVisibility: z\.enum\(workspaceTeamVisibilities\)/);
  assert.match(server, /updateWorkspaceSettingsForCurrentUser/);
  assert.match(server, /membershipCan\(membership, "workspace:manage"\)/);
  assert.match(server, /updateWorkspaceSettings\(supabase, membership\.workspace\.id, parsedInput\)/);
  assert.match(repository, /team_visibility: parsedInput\.teamVisibility/);
  assert.match(server, /mapWorkspaceUpdateError/);
});

test("RAD-015 replaces settings placeholder with guarded workspace settings UI", async () => {
  for (const path of [
    "src/app/(app)/settings/actions.ts",
    "src/app/(app)/settings/page.tsx",
    "src/components/workspaces/workspace-settings-form.tsx",
  ]) {
    await fileExists(path);
  }

  const page = await readWorkspaceFile("src/app/(app)/settings/page.tsx");
  const action = await readWorkspaceFile("src/app/(app)/settings/actions.ts");
  const form = await readWorkspaceFile("src/components/workspaces/workspace-settings-form.tsx");

  assert.match(page, /WorkspaceSettingsForm/);
  assert.match(page, /resolveRadarEnvironment/);
  assert.match(page, /isSupabaseConfigured/);
  assert.match(page, /membershipCan\(membership, "workspace:manage"\)/);
  assert.match(page, /Radar environment/);
  assert.match(page, /Supabase auth/);
  assert.match(action, /updateWorkspaceSettingsAction/);
  assert.match(action, /revalidatePath\("\/settings"\)/);
  assert.match(form, /Workspace profile/);
  assert.match(form, /Workspace name/);
  assert.match(form, /Workspace slug/);
  assert.match(form, /Team visibility/);
  assert.match(form, /Only workspace admins can update these settings/);
  assert.doesNotMatch(page, /RoutePlaceholder/);
});
