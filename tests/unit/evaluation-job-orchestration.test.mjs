import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-051 adds a server-only evaluation job orchestration boundary", async () => {
  const orchestrator = await readWorkspaceFile("src/lib/evaluation/job-orchestration.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/evaluation.ts");

  assert.match(orchestrator, /server-only/);
  assert.match(orchestrator, /export async function queueEvaluationJob/);
  assert.match(orchestrator, /export async function runNextEvaluationJob/);
  assert.match(orchestrator, /EvaluationJobRunner/);
  assert.match(orchestrator, /EvaluationJobContext/);
  assert.match(repository, /export async function listQueuedEvaluationRunsForWorkspace/);
  assert.match(repository, /export async function claimQueuedEvaluationRun/);
  assert.match(repository, /export async function updateEvaluationRunJob/);
});

test("RAD-051 queues assertion evaluation work with durable orchestration metadata", async () => {
  const orchestrator = await readWorkspaceFile("src/lib/evaluation/job-orchestration.ts");
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");

  assert.match(orchestrator, /status: "queued"/);
  assert.match(orchestrator, /queueReason: input\.queueReason/);
  assert.match(orchestrator, /attempts: 0/);
  assert.match(orchestrator, /ORCHESTRATOR_VERSION = "rad-051"/);
  assert.match(actions, /queueEvaluationJob/);
  assert.match(actions, /queueReason: "manual"/);
  assert.match(actions, /executionState: "queued_for_runner"/);
  assert.match(actions, /Approve at least one runnable test case before queueing a manual run/);
});

test("RAD-051 claims due queued runs before invoking runner work", async () => {
  const orchestrator = await readWorkspaceFile("src/lib/evaluation/job-orchestration.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/evaluation.ts");

  assert.match(repository, /\.eq\("status", "queued"\)/);
  assert.match(repository, /scheduled_for\.is\.null,scheduled_for\.lte/);
  assert.match(repository, /status: "running"/);
  assert.match(repository, /\.eq\("status", "queued"\)/);
  assert.match(orchestrator, /const queuedRuns = await listQueuedEvaluationRunsForWorkspace/);
  assert.match(orchestrator, /claimQueuedEvaluationRun/);
  assert.match(orchestrator, /reason: "claim_lost"/);
  assert.match(orchestrator, /await runner\(\{ jobId, attempt, maxAttempts, run: claimedRun \}\)/);
});

test("RAD-051 tracks terminal results and retryable failures", async () => {
  const orchestrator = await readWorkspaceFile("src/lib/evaluation/job-orchestration.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/evaluation.ts");

  assert.match(orchestrator, /status: result\.status/);
  assert.match(orchestrator, /state: "completed"/);
  assert.match(orchestrator, /status: "retry_scheduled"/);
  assert.match(orchestrator, /state: "retry_scheduled"/);
  assert.match(orchestrator, /status: "error"/);
  assert.match(orchestrator, /state: "error"/);
  assert.match(orchestrator, /baseRetryDelayMs \* 2 \*\*/);
  assert.match(repository, /update\.scheduled_for = input\.scheduledFor/);
  assert.match(repository, /update\.execution_metadata = input\.executionMetadata/);
});

test("RAD-051 keeps job orchestration assertion-led and secret-safe", async () => {
  const orchestrator = await readWorkspaceFile("src/lib/evaluation/job-orchestration.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/evaluation.ts");
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");

  assert.match(dataModel, /RAD-051/);

  for (const source of [orchestrator, repository]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});
