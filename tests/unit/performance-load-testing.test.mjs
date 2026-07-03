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

test("RAD-098 adds a repeatable pilot load smoke command", async () => {
  await fileExists("scripts/run-pilot-load-smoke.mjs");

  const packageJson = JSON.parse(await readWorkspaceFile("package.json"));
  const script = await readWorkspaceFile("scripts/run-pilot-load-smoke.mjs");

  assert.equal(packageJson.scripts["perf:pilot"], "node scripts/run-pilot-load-smoke.mjs");
  assert.match(script, /sourceIngestion: 650/);
  assert.match(script, /embeddingScheduling: 250/);
  assert.match(script, /evaluationScheduling: 350/);
  assert.match(script, /dashboardAggregation: 120/);
  assert.match(script, /sourceCount: 120/);
  assert.match(script, /evaluationRuns: 900/);
  assert.match(script, /simulateEmbeddingScheduling/);
  assert.match(script, /simulateEvaluationScheduling/);
  assert.match(script, /buildDashboardSummary/);
  assert.match(script, /assertBudget\("total"/);
});

test("RAD-098 documents performance budgets and staging follow-up", async () => {
  const docs = await readWorkspaceFile("docs/PERFORMANCE_AND_LOAD.md");
  const strategy = await readWorkspaceFile("docs/TEST_STRATEGY.md");

  assert.match(docs, /pnpm perf:pilot/);
  assert.match(docs, /Pilot profile/);
  assert.match(docs, /Embedding scheduling simulation/);
  assert.match(docs, /Evaluation scheduling simulation/);
  assert.match(docs, /Dashboard aggregation simulation/);
  assert.match(docs, /Before opening a larger pilot/);
  assert.match(strategy, /pnpm perf:pilot/);
});
