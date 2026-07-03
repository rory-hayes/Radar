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

test("RAD-057 persists scored Knowledge Runner test case results", async () => {
  await fileExists("src/lib/evaluation/knowledge-runner.ts");

  const runner = await readWorkspaceFile("src/lib/evaluation/knowledge-runner.ts");

  assert.match(runner, /evaluateKnowledgeAnswer/);
  assert.match(runner, /status: evaluation\.status/);
  assert.match(runner, /score: evaluation\.score/);
  assert.match(runner, /confidence: evaluation\.confidence/);
  assert.match(runner, /evaluatorSummary: boundedText\(evaluation\.summary, 2000\)/);
  assert.match(runner, /rubricVersion: evaluation\?\.rubricVersion/);
  assert.match(runner, /dimensionScores: evaluation\?\.dimensions\.map/);
});

test("RAD-057 aggregates persisted result statuses into evaluation run summaries", async () => {
  const runner = await readWorkspaceFile("src/lib/evaluation/knowledge-runner.ts");
  const orchestrator = await readWorkspaceFile("src/lib/evaluation/job-orchestration.ts");

  assert.match(runner, /summarizeKnowledgeResultRecords/);
  assert.match(runner, /aggregateKnowledgeRunStatus/);
  assert.match(runner, /passedCount: resultSummary\.passedCount/);
  assert.match(runner, /warningCount: resultSummary\.warningCount/);
  assert.match(runner, /failedCount: resultSummary\.failedCount/);
  assert.match(runner, /errorCount: resultSummary\.errorCount/);
  assert.match(runner, /score: resultSummary\.score/);
  assert.match(runner, /confidence: resultSummary\.confidence/);
  assert.match(orchestrator, /score: result\.score \?\? claimedRun\.score/);
  assert.match(orchestrator, /confidence: result\.confidence \?\? claimedRun\.confidence/);
});

test("RAD-057 repository already stores summaries scoring and evidence refs", async () => {
  const repository = await readWorkspaceFile("src/lib/repositories/evaluation.ts");
  const schema = await readWorkspaceFile("src/lib/evaluation/schema.ts");
  const migration = await readWorkspaceFile("supabase/migrations/20260703105000_create_evaluation_runs_and_results.sql");

  assert.match(repository, /score: parsedInput\.score \?\? null/);
  assert.match(repository, /confidence: parsedInput\.confidence \?\? null/);
  assert.match(repository, /actual_summary: parsedInput\.actualSummary \?\? null/);
  assert.match(repository, /evaluator_summary: parsedInput\.evaluatorSummary \?\? null/);
  assert.match(repository, /evidence_refs: parsedInput\.evidenceRefs/);
  assert.match(schema, /testCaseResultStatuses = \["passed", "warning", "failed", "inconclusive", "error", "skipped"\]/);
  assert.match(migration, /test_case_results_score_range/);
  assert.match(migration, /test_case_results_confidence_range/);
});

test("RAD-057 documents result persistence and keeps scope locked", async () => {
  const evalSpec = await readWorkspaceFile("docs/EVAL_ENGINE_SPEC.md");
  const task = await readWorkspaceFile("tasks/phase-5-eval-knowledge-runner/rad-057-persist-test-case-results-and-scoring.md");
  const runner = await readWorkspaceFile("src/lib/evaluation/knowledge-runner.ts");

  assert.match(evalSpec, /RAD-057/);
  assert.match(evalSpec, /per-test scored results/);
  assert.match(task, /Persist test case results and scoring/);

  for (const source of [runner]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
    assert.doesNotMatch(source, /apiKey|secretKey|accessToken|refreshToken|service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});
