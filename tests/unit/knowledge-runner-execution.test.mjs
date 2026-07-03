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

test("RAD-055 adds a server-only Knowledge Runner execution loop", async () => {
  await fileExists("src/lib/evaluation/knowledge-runner.ts");

  const runner = await readWorkspaceFile("src/lib/evaluation/knowledge-runner.ts");

  assert.match(runner, /server-only/);
  assert.match(runner, /export const knowledgeRunnerVersion = "rad-055"/);
  assert.match(runner, /export async function runNextKnowledgeEvaluationJob/);
  assert.match(runner, /export async function runKnowledgeEvaluationJob/);
  assert.match(runner, /KnowledgeRunnerTargetClient/);
  assert.match(runner, /runNextEvaluationJob/);
});

test("RAD-055 validates workspace assertion test cases and ready targets", async () => {
  const runner = await readWorkspaceFile("src/lib/evaluation/knowledge-runner.ts");

  assert.match(runner, /run\.runnerType !== "knowledge"/);
  assert.match(runner, /getAssertionById/);
  assert.match(runner, /listTestCasesForAssertion/);
  assert.match(runner, /testCase\.status === "approved" && testCase\.type === "customer_question"/);
  assert.match(runner, /loadKnowledgeTargetConfigurationsForAssertion/);
  assert.match(runner, /selectKnowledgeRunnerTarget/);
  assert.match(runner, /no_ready_knowledge_target/);
});

test("RAD-055 captures raw test outputs with evidence refs", async () => {
  const runner = await readWorkspaceFile("src/lib/evaluation/knowledge-runner.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/evaluation.ts");

  assert.match(runner, /loadEvaluationEvidence/);
  assert.match(runner, /createTestCaseResult/);
  assert.match(runner, /actualOutputForResponse/);
  assert.match(runner, /actualSummary: boundedText\(response\.answer, 2000\)/);
  assert.match(runner, /evidenceRefs/);
  assert.match(runner, /dedupeEvidenceRefs/);
  assert.match(repository, /actual_output: parsedInput\.actualOutput/);
  assert.match(repository, /evidence_refs: parsedInput\.evidenceRefs/);
});

test("RAD-055 executes endpoint and uploaded answer-set targets without storing credentials", async () => {
  const runner = await readWorkspaceFile("src/lib/evaluation/knowledge-runner.ts");

  assert.match(runner, /defaultKnowledgeTargetClient/);
  assert.match(runner, /answer_set_evidence/);
  assert.match(runner, /fetchKnowledgeTarget/);
  assert.match(runner, /url\.searchParams\.set\("question", question\)/);
  assert.match(runner, /"Content-Type": "application\/json"/);
  assert.match(runner, /extractAnswerText/);
  assert.match(runner, /Endpoint credential mode is configured but runner credentials are not available/);

  assert.doesNotMatch(runner, /apiKey|secretKey|accessToken|refreshToken|service_role|sb_secret/i);
  assert.doesNotMatch(runner, /Authorization|Bearer|Basic [A-Za-z0-9]/);
  assert.doesNotMatch(runner, /console\.log|console\.error/);
});

test("RAD-055 documents Knowledge Runner outputs and scope boundaries", async () => {
  const evalSpec = await readWorkspaceFile("docs/EVAL_ENGINE_SPEC.md");
  const task = await readWorkspaceFile("tasks/phase-5-eval-knowledge-runner/rad-055-implement-knowledge-runner-execution-loop.md");
  const runner = await readWorkspaceFile("src/lib/evaluation/knowledge-runner.ts");

  assert.match(evalSpec, /RAD-055/);
  assert.match(evalSpec, /Knowledge Runner outputs/);
  assert.match(task, /Knowledge Runner execution loop/);

  for (const source of [runner]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
  }
});
