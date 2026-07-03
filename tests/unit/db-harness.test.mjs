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

test("RAD-029 adds database harness package scripts", async () => {
  const packageJson = JSON.parse(await readWorkspaceFile("package.json"));

  assert.equal(packageJson.scripts["db:harness"], "node scripts/verify-db-harness.mjs");
  assert.equal(packageJson.scripts["db:harness:apply"], "node scripts/verify-db-harness.mjs --apply");
});

test("RAD-029 harness verifies migrations seed coverage indexes and RLS", async () => {
  await fileExists("scripts/verify-db-harness.mjs");

  const script = await readWorkspaceFile("scripts/verify-db-harness.mjs");

  assert.match(script, /requiredMigrations/);
  assert.match(script, /workspaceOwnedTables/);
  assert.match(script, /representativeSeedTables/);
  assert.match(script, /verifyMigrationOrder/);
  assert.match(script, /verifySchemaConstraintsAndIndexes/);
  assert.match(script, /verifyWorkspaceRls/);
  assert.match(script, /verifyStorageBucket/);
  assert.match(script, /verifySeedCoverage/);
  assert.match(script, /verifyForbiddenSeedPatterns/);
});

test("RAD-029 harness apply mode runs Supabase reset and seed validation", async () => {
  const script = await readWorkspaceFile("scripts/verify-db-harness.mjs");

  assert.match(script, /process\.argv\.includes\("--apply"\)/);
  assert.match(script, /run\("pnpm", \["supabase:reset"\]\)/);
  assert.match(script, /run\("pnpm", \["validate:seed"\]\)/);
  assert.match(script, /Use `pnpm db:harness:apply` when Docker is running/);
});

test("RAD-029 documents the local and CI database harness", async () => {
  const supabaseDocs = await readWorkspaceFile("docs/SUPABASE_LOCAL_DEVELOPMENT.md");
  const migrationsReadme = await readWorkspaceFile("supabase/migrations/README.md");
  const seedsReadme = await readWorkspaceFile("supabase/seeds/README.md");

  assert.match(supabaseDocs, /pnpm db:harness/);
  assert.match(supabaseDocs, /pnpm db:harness:apply/);
  assert.match(migrationsReadme, /verify-db-harness/);
  assert.match(seedsReadme, /RAD-029/);
});
