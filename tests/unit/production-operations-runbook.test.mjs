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

test("RAD-099 creates a production operations runbook", async () => {
  await fileExists("docs/PRODUCTION_OPERATIONS_RUNBOOK.md");

  const runbook = await readWorkspaceFile("docs/PRODUCTION_OPERATIONS_RUNBOOK.md");

  for (const heading of [
    "Environments",
    "Environment Variables",
    "Release Preflight",
    "Deployment Procedure",
    "Migration Procedure",
    "Rollback",
    "Cron And Job Operations",
    "Backups And Data Recovery",
    "Incident Response",
    "Support Procedures",
    "Launch Checklist",
  ]) {
    assert.match(runbook, new RegExp(`## ${heading}`));
  }

  for (const command of [
    "pnpm validate:env",
    "pnpm validate:seed",
    "pnpm lint",
    "pnpm typecheck",
    "pnpm test",
    "pnpm test:e2e",
    "pnpm perf:pilot",
    "pnpm build",
    "pnpm audit --audit-level high",
    "pnpm db:harness",
    "pnpm db:harness:apply",
    "pnpm exec supabase db push --dry-run --linked",
    "pnpm exec supabase db push --linked",
  ]) {
    assert.match(runbook, new RegExp(escapeRegExp(command)));
  }
});

test("RAD-099 documents rollback incidents backups and support boundaries", async () => {
  const runbook = await readWorkspaceFile("docs/PRODUCTION_OPERATIONS_RUNBOOK.md");

  assert.match(runbook, /Use Vercel deployment history to promote the last known-good production deployment/);
  assert.match(runbook, /Supabase migrations in this repo are forward-only/);
  assert.match(runbook, /Supabase Postgres backups or PITR are enabled/);
  assert.match(runbook, /SEV-1/);
  assert.match(runbook, /Customer data incident/);
  assert.match(runbook, /Source sync failure/);
  assert.match(runbook, /Data export or deletion/);
  assert.doesNotMatch(runbook, /generic AI eval platform|prompt playground|trace explorer|workflow canvas|integration marketplace/i);
});

test("RAD-099 links runbook and automates the performance smoke gate", async () => {
  const deployment = await readWorkspaceFile("docs/DEPLOYMENT_AND_ENVIRONMENTS.md");
  const ci = await readWorkspaceFile(".github/workflows/ci.yml");

  assert.match(deployment, /Production Operations Runbook/);
  assert.match(ci, /Pilot performance smoke/);
  assert.match(ci, /pnpm perf:pilot/);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
