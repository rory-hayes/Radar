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

test("RAD-097 persists workspace retention settings", async () => {
  const migration = await readWorkspaceFile("supabase/migrations/20260703133000_add_data_lifecycle_controls.sql");
  const schema = await readWorkspaceFile("src/lib/workspaces/schema.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/workspaces.ts");
  const settingsAction = await readWorkspaceFile("src/app/(app)/settings/actions.ts");
  const settingsForm = await readWorkspaceFile("src/components/workspaces/workspace-settings-form.tsx");

  assert.match(migration, /add column data_retention_days integer not null default 180/);
  assert.match(migration, /workspaces_data_retention_days_check check \(data_retention_days in \(30, 90, 180, 365\)\)/);
  assert.match(schema, /workspaceDataRetentionDayOptions = \[30, 90, 180, 365\]/);
  assert.match(schema, /dataRetentionDays/);
  assert.match(repository, /data_retention_days: parsedInput\.dataRetentionDays/);
  assert.match(settingsAction, /dataRetentionDays: String\(formData\.get\("dataRetentionDays"\)/);
  assert.match(settingsForm, /Data retention/);
  assert.match(settingsForm, /workspaceDataRetentionDayOptions\.map/);
});

test("RAD-097 deletes source data with artifact cleanup and audit logging", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/sources/actions.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/sources.ts");
  const storage = await readWorkspaceFile("src/lib/storage/evidence-artifacts.ts");
  const detailPage = await readWorkspaceFile("src/app/(app)/sources/[sourceId]/page.tsx");
  const deletePanel = await readWorkspaceFile("src/components/sources/source-delete-panel.tsx");

  assert.match(repository, /export async function listSourceDocumentStoragePaths/);
  assert.match(repository, /\.from\("source_documents"\)/);
  assert.match(repository, /\.eq\("workspace_id", workspaceId\)/);
  assert.match(storage, /export async function removeEvidenceArtifacts/);
  assert.match(storage, /assertEvidenceArtifactPathForWorkspace\(storagePath, workspaceId\)/);
  assert.match(actions, /export async function deleteSourceAction/);
  assert.match(actions, /permission: "source:delete"/);
  assert.match(actions, /listSourceDocumentStoragePaths\(supabase, membership\.workspace\.id, source\.id\)/);
  assert.match(actions, /removeEvidenceArtifacts\(supabase, membership\.workspace\.id, storagePaths\)/);
  assert.match(actions, /deleteSource\(supabase, membership\.workspace\.id, source\.id\)/);
  assert.match(actions, /action: "source\.deleted"/);
  assert.match(deletePanel, /Type \{sourceName\} exactly/);
  assert.match(detailPage, /SourceDeletePanel/);
});

test("RAD-097 exports workspace data with redactions and artifact manifest", async () => {
  await fileExists("src/app/api/workspace/export/route.ts");
  await fileExists("src/lib/data-lifecycle/workspace-export.ts");

  const route = await readWorkspaceFile("src/app/api/workspace/export/route.ts");
  const exportBuilder = await readWorkspaceFile("src/lib/data-lifecycle/workspace-export.ts");
  const lifecyclePanel = await readWorkspaceFile("src/components/workspaces/workspace-data-lifecycle-panel.tsx");

  assert.match(route, /export async function GET/);
  assert.match(route, /membershipCan\(membership, "workspace:manage"\)/);
  assert.match(route, /Content-Disposition/);
  assert.match(route, /Cache-Control": "no-store"/);
  assert.match(exportBuilder, /schemaVersion: "radar\.workspace-export\.v1"/);
  assert.match(exportBuilder, /encrypted values are excluded/);
  assert.match(exportBuilder, /Stripe customer, subscription, and price identifiers are excluded/);
  assert.match(exportBuilder, /Private artifact storage paths are listed without signed download URLs/);
  assert.match(exportBuilder, /artifactManifest/);
  assert.match(exportBuilder, /listRunnerCredentials/);
  assert.doesNotMatch(exportBuilder, /encrypted_value/);
  assert.match(lifecyclePanel, /Export workspace/);
  assert.match(lifecyclePanel, /Manifest only/);
});

test("RAD-097 documents data handling paths", async () => {
  const lifecycleDoc = await readWorkspaceFile("docs/DATA_LIFECYCLE.md");
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");

  assert.match(lifecycleDoc, /Source deletion/);
  assert.match(lifecycleDoc, /Workspace export/);
  assert.match(lifecycleDoc, /Retention/);
  assert.match(lifecycleDoc, /Deletion and export are admin-only operations/);
  assert.match(dataModel, /RAD-097 adds customer data lifecycle controls/);
});
