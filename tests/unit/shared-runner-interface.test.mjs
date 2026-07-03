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

test("RAD-061 adds a server-only shared runner contract", async () => {
  await fileExists("src/lib/evaluation/runner-contract.ts");

  const contract = await readWorkspaceFile("src/lib/evaluation/runner-contract.ts");

  assert.match(contract, /server-only/);
  assert.match(contract, /sharedRunnerContractVersion = "rad-061"/);
  assert.match(contract, /RunnerEvidenceArtifact/);
  assert.match(contract, /RunnerRetrySemantics/);
  assert.match(contract, /SharedRunnerContext/);
  assert.match(contract, /SharedRunnerTestCaseInput/);
  assert.match(contract, /SharedRunnerCaseResult/);
  assert.match(contract, /SharedRunnerExecutionResult/);
});

test("RAD-061 contract covers statuses artifacts errors and retry metadata", async () => {
  const contract = await readWorkspaceFile("src/lib/evaluation/runner-contract.ts");

  for (const artifactKind of [
    "source_evidence",
    "screenshot",
    "trace",
    "http_exchange",
    "email_receipt",
    "webhook_event",
    "redacted_log",
  ]) {
    assert.match(contract, new RegExp(`"${artifactKind}"`));
  }

  assert.match(contract, /status: TestCaseResultStatus/);
  assert.match(contract, /actualOutput: JsonRecord/);
  assert.match(contract, /evidenceRefs: EvaluationEvidenceRefInput\[\]/);
  assert.match(contract, /artifacts: RunnerEvidenceArtifact\[\]/);
  assert.match(contract, /errorMessage\?: string/);
  assert.match(contract, /retryable: boolean/);
  assert.match(contract, /attempt: number/);
  assert.match(contract, /maxAttempts: number/);
});

test("RAD-061 provides reusable summary and metadata helpers", async () => {
  const contract = await readWorkspaceFile("src/lib/evaluation/runner-contract.ts");

  assert.match(contract, /assertRunnerTypeMatches/);
  assert.match(contract, /summarizeSharedRunnerCaseResults/);
  assert.match(contract, /aggregateRunnerStatus/);
  assert.match(contract, /dedupeRunnerEvidenceRefs/);
  assert.match(contract, /dedupeRunnerArtifacts/);
  assert.match(contract, /sharedRunnerContractMetadata/);
  assert.match(contract, /runnerContract/);
  assert.match(contract, /SharedRunnerContractError/);
});

test("RAD-061 wires Knowledge Runner into the shared contract without adding scope", async () => {
  const runner = await readWorkspaceFile("src/lib/evaluation/knowledge-runner.ts");
  const runnerSpec = await readWorkspaceFile("docs/RUNNERS_SPEC.md");

  assert.match(runner, /type SharedRunnerExecutionResult/);
  assert.match(runner, /assertRunnerTypeMatches/);
  assert.match(runner, /sharedRunnerContractMetadata/);
  assert.match(runner, /retrySemanticsFromRun/);
  assert.match(runnerSpec, /RAD-061 defines the shared runner contract/);
  assert.match(runnerSpec, /Knowledge, Journey, and Integration runners must all return the same top-level contract/);

  assert.doesNotMatch(runner, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
  assert.doesNotMatch(runner, /console\.log|console\.error/);
});
