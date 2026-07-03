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

test("RAD-067 adds generic webhook and API assertion check definitions", async () => {
  await fileExists("src/lib/evaluation/integration-checks.ts");

  const checks = await readWorkspaceFile("src/lib/evaluation/integration-checks.ts");

  assert.match(checks, /server-only/);
  assert.match(checks, /genericIntegrationCheckVersion = "rad-067"/);
  assert.match(checks, /genericIntegrationCheckDefinitionSchema/);
  assert.match(checks, /genericIntegrationCheckTemplates/);
  assert.match(checks, /createGenericIntegrationCheckInput/);
  assert.match(checks, /createGenericIntegrationTestCaseBlueprint/);
});

test("RAD-067 supports the required generic Integration check kinds", async () => {
  const checks = await readWorkspaceFile("src/lib/evaluation/integration-checks.ts");

  for (const checkKind of [
    "webhook_fired",
    "api_expected_state",
    "ticket_endpoint_accepted",
    "billing_object_updated",
  ]) {
    assert.match(checks, new RegExp(`"${checkKind}"`));
  }

  assert.match(checks, /Webhook Fired/);
  assert.match(checks, /API Expected State/);
  assert.match(checks, /Ticket Endpoint Accepted/);
  assert.match(checks, /Billing Object Updated/);
});

test("RAD-067 compiles generic checks to RAD-066 integration_check inputs", async () => {
  const checks = await readWorkspaceFile("src/lib/evaluation/integration-checks.ts");
  const runner = await readWorkspaceFile("src/lib/evaluation/integration-runner.ts");

  assert.match(checks, /integrationCheckSchema\.parse/);
  assert.match(checks, /type: "integration_check" as const/);
  assert.match(checks, /expectedStatus/);
  assert.match(checks, /acceptableStatuses/);
  assert.match(checks, /responseContains/);
  assert.match(checks, /jsonPath/);
  assert.match(checks, /jsonEquals/);
  assert.match(runner, /jsonPath: testCase\.input\.jsonPath/);
  assert.match(runner, /jsonEquals: testCase\.input\.jsonEquals/);
});

test("RAD-067 validates API and billing expected state from JSON responses", async () => {
  const runner = await readWorkspaceFile("src/lib/evaluation/integration-runner.ts");

  assert.match(runner, /responseJsonValue/);
  assert.match(runner, /JSON\.parse\(body\)/);
  assert.match(runner, /expected JSON state was not present/);
  assert.match(runner, /redactJsonValue/);
  assert.match(runner, /jsonEquals: redactJsonValue/);
});

test("RAD-067 stays generic and avoids an integration marketplace", async () => {
  const checks = await readWorkspaceFile("src/lib/evaluation/integration-checks.ts");
  const runnerSpec = await readWorkspaceFile("docs/RUNNERS_SPEC.md");

  assert.match(runnerSpec, /RAD-067 adds generic Integration check definitions/);
  assert.match(runnerSpec, /webhook_fired/);
  assert.match(runnerSpec, /billing_object_updated/);

  assert.doesNotMatch(checks, /stripe|salesforce|hubspot|zendesk|intercom|slack/i);
  assert.doesNotMatch(checks, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
  assert.doesNotMatch(checks, /console\.log|console\.error/);
});
