import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-019 seeds deterministic local demo users and workspace membership", async () => {
  const seed = await readWorkspaceFile("supabase/seeds/radar-demo-workspace.sql");

  assert.match(seed, /RAD-019 deterministic local\/test seed/);
  assert.match(seed, /insert into auth\.users/);
  assert.match(seed, /admin@radar-demo\.test/);
  assert.match(seed, /editor@radar-demo\.test/);
  assert.match(seed, /viewer@radar-demo\.test/);
  assert.match(seed, /insert into public\.workspaces/);
  assert.match(seed, /Radar Demo Workspace/);
  assert.match(seed, /radar-demo-workspace/);
  assert.match(seed, /insert into public\.workspace_members/);
  assert.match(seed, /insert into public\.sources/);
  assert.match(seed, /insert into public\.source_versions/);
  assert.match(seed, /insert into public\.source_documents/);
  assert.match(seed, /insert into public\.source_chunks/);
  assert.match(seed, /'admin'/);
  assert.match(seed, /'editor'/);
  assert.match(seed, /'viewer'/);
  assert.match(seed, /on conflict \(workspace_id, user_id\) do update/);
});

test("RAD-019 represents sample assertions sources findings and activity without early product tables", async () => {
  const seed = await readWorkspaceFile("supabase/seeds/radar-demo-workspace.sql");
  const docs = await readWorkspaceFile("docs/DEMO_DATA_POLICY.md");

  assert.match(seed, /insert into public\.audit_logs/);
  assert.match(seed, /source\.created/);
  assert.match(seed, /assertion\.created/);
  assert.match(seed, /run\.rerun_requested/);
  assert.match(seed, /finding\.updated/);
  assert.match(seed, /Pricing policy source/);
  assert.match(seed, /Pricing policy excerpt/);
  assert.match(seed, /Synthetic pricing policy/);
  assert.match(seed, /Pricing answers match the pricing page/);
  assert.match(seed, /AI support quoted an outdated plan limit/);
  assert.match(seed, /workspace_id/);
  assert.doesNotMatch(seed, /create table public\.(sources|assertions|findings|evaluation_runs)/i);
  assert.doesNotMatch(seed, /https?:\/\//i);
  assert.doesNotMatch(seed, /service_role|whsec_|sk_live|BEGIN PRIVATE KEY/i);
  assert.match(docs, /RAD-021 introduces real source tables/);
  assert.match(docs, /Until assertion, run, and finding schemas exist/);
  assert.match(docs, /workspace-scoped audit metadata/);
});
