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

test("RAD-066 adds a server-only Integration Runner foundation", async () => {
  await fileExists("src/lib/evaluation/integration-runner.ts");

  const runner = await readWorkspaceFile("src/lib/evaluation/integration-runner.ts");

  assert.match(runner, /server-only/);
  assert.match(runner, /integrationRunnerVersion = "rad-066"/);
  assert.match(runner, /runNextIntegrationEvaluationJob/);
  assert.match(runner, /runIntegrationEvaluationJob/);
  assert.match(runner, /IntegrationRunnerHttpClient/);
  assert.match(runner, /defaultIntegrationHttpClient/);
  assert.match(runner, /run\.runnerType !== "integration"/);
});

test("RAD-066 executes approved integration checks through the shared runner contract", async () => {
  const runner = await readWorkspaceFile("src/lib/evaluation/integration-runner.ts");

  assert.match(runner, /approvedRunnableTestCasesForRunner\("integration"/);
  assert.match(runner, /filterManualRerunTestCases/);
  assert.match(runner, /assertRunnerTypeMatches/);
  assert.match(runner, /sharedRunnerContractMetadata/);
  assert.match(runner, /createTestCaseResult/);
  assert.match(runner, /runnerType: "integration"/);
  assert.match(runner, /state: "http_checks_persisted"/);
  assert.match(runner, /no_approved_integration_check_test_cases/);
});

test("RAD-066 defines bounded HTTP checks with response validation", async () => {
  const runner = await readWorkspaceFile("src/lib/evaluation/integration-runner.ts");

  assert.match(runner, /integrationHttpMethods = \["GET", "POST", "PUT", "PATCH", "DELETE"\]/);
  assert.match(runner, /integrationCheckSchema/);
  assert.match(runner, /integrationCheckFromTestCase/);
  assert.match(runner, /acceptableStatuses/);
  assert.match(runner, /expectedStatus/);
  assert.match(runner, /responseContains/);
  assert.match(runner, /validateIntegrationResponse/);
  assert.match(runner, /status: "passed"/);
  assert.match(runner, /status: "failed"/);
  assert.match(runner, /AbortController/);
});

test("RAD-066 handles auth headers only through execution-time credentials", async () => {
  const runner = await readWorkspaceFile("src/lib/evaluation/integration-runner.ts");

  assert.match(runner, /integrationCredentialSchema/);
  assert.match(runner, /integrationAuthSchema/);
  assert.match(runner, /type: z\.literal\("bearer"\)/);
  assert.match(runner, /type: z\.literal\("api_key_header"\)/);
  assert.match(runner, /applyIntegrationAuthHeaders/);
  assert.match(runner, /Authorization: `Bearer \$\{credential\.value\}`/);
  assert.match(runner, /Missing runner credential/);
  assert.doesNotMatch(runner, /process\.env\.[A-Z_]*(API|TOKEN|SECRET|KEY)/);
});

test("RAD-066 captures redacted HTTP exchange artifacts without adding marketplace scope", async () => {
  const runner = await readWorkspaceFile("src/lib/evaluation/integration-runner.ts");
  const runnerSpec = await readWorkspaceFile("docs/RUNNERS_SPEC.md");

  assert.match(runner, /kind: "http_exchange"/);
  assert.match(runner, /redacted: true/);
  assert.match(runner, /buildHttpExchangeArtifact/);
  assert.match(runner, /redactIntegrationText/);
  assert.match(runner, /redactedHeaders/);
  assert.match(runner, /isSensitiveHeader/);
  assert.match(runner, /safeUrlPreview/);
  assert.match(runner, /responseBodyHash/);
  assert.match(runner, /\[redacted-token\]/);
  assert.match(runnerSpec, /RAD-066 adds the server-only Integration Runner foundation/);
  assert.match(runnerSpec, /redacted `http_exchange` artifacts/);

  assert.doesNotMatch(runner, /console\.log|console\.error/);
  assert.doesNotMatch(runner, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
});
