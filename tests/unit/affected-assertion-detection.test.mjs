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

test("RAD-039 adds source link provenance for manual and auto-generated relationships", async () => {
  const migration = await readWorkspaceFile("supabase/migrations/20260703113000_add_assertion_source_change_detection.sql");
  const schema = await readWorkspaceFile("src/lib/assertions/schema.ts");
  const validation = await readWorkspaceFile("src/lib/validation/schemas.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/assertions.ts");

  assert.match(migration, /create type public\.assertion_source_relationship_type as enum/);
  assert.match(migration, /'manual'[\s\S]*'auto_generated'/);
  assert.match(migration, /add column relationship_type public\.assertion_source_relationship_type not null default 'manual'/);
  assert.match(migration, /assertion_sources_workspace_relationship_idx/);
  assert.match(schema, /assertionSourceRelationshipTypes = \["manual", "auto_generated"\]/);
  assert.match(validation, /relationshipType: z\.enum\(assertionSourceRelationshipTypes\)/);
  assert.match(repository, /relationship_type: parsedInput\.relationshipType/);
});

test("RAD-039 detects source-change impacted assertions through linked sources and schedules", async () => {
  await fileExists("src/lib/sources/affected-assertions.ts");

  const affected = await readWorkspaceFile("src/lib/sources/affected-assertions.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/assertions.ts");

  assert.match(affected, /export async function detectAffectedAssertionsForSourceChange/);
  assert.match(affected, /listSourceChangeAffectedAssertions/);
  assert.match(affected, /rerunCandidateCount/);
  assert.match(affected, /changed: false[\s\S]*affectedAssertions: \[\]/);
  assert.match(repository, /export async function listSourceChangeAffectedAssertions/);
  assert.match(repository, /\.from\("assertion_sources"\)/);
  assert.match(repository, /\.from\("assertions"\)/);
  assert.match(repository, /\.from\("assertion_runs_schedule"\)/);
  assert.match(repository, /sourceChangeTrigger = schedule\?\.sourceChangeTrigger \?\? true/);
  assert.match(repository, /assertion\.status === "active" && sourceChangeTrigger/);
});

test("RAD-039 source sync returns impacted assertions only when content changes", async () => {
  const syncJobs = await readWorkspaceFile("src/lib/sources/source-sync-jobs.ts");
  const route = await readWorkspaceFile("src/app/api/sources/sync/route.ts");
  const task = await readWorkspaceFile("tasks/phase-3-sources-evidence/rad-039-implement-affected-assertion-detection.md");

  assert.match(syncJobs, /detectAffectedAssertionsForSourceChange/);
  assert.match(syncJobs, /affectedAssertions\?: SourceChangeAffectedAssertion\[\]/);
  assert.match(syncJobs, /affectedAssertionCount\?: number/);
  assert.match(syncJobs, /rerunCandidateCount\?: number/);
  assert.match(syncJobs, /detectionReason: "content_changed"/);
  assert.match(route, /runSourceSyncJob/);
  assert.match(task, /changed source produces a clear list of impacted assertions/i);

  for (const source of [affectedSourceScope(), syncJobs, route]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});

function affectedSourceScope() {
  return [
    "assertion-led",
    "source-minimal",
    "customer-facing business verification",
  ].join("\n");
}
