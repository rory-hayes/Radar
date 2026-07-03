import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("RAD-009 seed policy validator passes for the committed contract", () => {
  const result = spawnSync(process.execPath, ["scripts/validate-seed-policy.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Radar seed policy validation passed/);
});

test("RAD-009 separates local demo data from production-like environments", async () => {
  const policySource = await readFile("src/lib/demo-data-policy.ts", "utf8");
  const policyDocs = await readFile("docs/DEMO_DATA_POLICY.md", "utf8");

  assert.match(policySource, /demoDataAllowedEnvironments = \["local", "test"\]/);
  assert.match(policySource, /demoDataProhibitedEnvironments = \["preview", "staging", "production"\]/);
  assert.match(policySource, /productRuntimeImportsAllowed: false/);
  assert.match(policySource, /realCustomerDataAllowed: false/);
  assert.match(policyDocs, /Product routes, server actions, repositories, and UI components/);
  assert.match(policyDocs, /must not import seed files/);
});

test("RAD-009 keeps the current seed entrypoint deterministic and row-free", async () => {
  const seedSql = await readFile("supabase/seed.sql", "utf8");
  const seedReadme = await readFile("supabase/seeds/README.md", "utf8");

  assert.match(seedSql, /RADAR_LOCAL_SEED_CONTRACT v1/);
  assert.match(seedSql, /workspace_id/);
  assert.match(seedSql, /supabase\/seeds/);
  assert.doesNotMatch(seedSql, /\bINSERT\s+INTO\b/i);
  assert.match(seedReadme, /stable synthetic IDs/);
  assert.match(seedReadme, /RAD-019 owns the first representative demo workspace/);
});
