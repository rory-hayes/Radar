import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-070 gate verifies the Knowledge Journey Integration runner triad", async () => {
  const contract = await readWorkspaceFile("src/lib/evaluation/runner-contract.ts");
  const knowledgeRunner = await readWorkspaceFile("src/lib/evaluation/knowledge-runner.ts");
  const journeyRunner = await readWorkspaceFile("src/lib/evaluation/journey-runner.ts");
  const journeySchema = await readWorkspaceFile("src/lib/evaluation/journey-schema.ts");
  const integrationRunner = await readWorkspaceFile("src/lib/evaluation/integration-runner.ts");

  assert.match(contract, /runnerArtifactKinds/);
  assert.match(contract, /SharedRunnerExecutionResult/);
  assert.match(contract, /sharedRunnerContractMetadata/);
  assert.match(knowledgeRunner, /runNextKnowledgeEvaluationJob/);
  assert.match(knowledgeRunner, /createTestCaseResult/);
  assert.match(journeyRunner, /runJourneyBrowserSession/);
  assert.match(journeySchema, /journeyStepDefinitionSchema/);
  assert.match(integrationRunner, /runNextIntegrationEvaluationJob/);
  assert.match(integrationRunner, /validateIntegrationResponse/);
});

test("RAD-070 gate verifies Phase 6 runner artifacts and credential hardening", async () => {
  const contract = await readWorkspaceFile("src/lib/evaluation/runner-contract.ts");
  const journeyRunner = await readWorkspaceFile("src/lib/evaluation/journey-runner.ts");
  const emailReceipts = await readWorkspaceFile("src/lib/evaluation/email-receipts.ts");
  const integrationRunner = await readWorkspaceFile("src/lib/evaluation/integration-runner.ts");
  const credentials = await readWorkspaceFile("src/lib/credentials/runner-credentials.ts");
  const credentialRepository = await readWorkspaceFile("src/lib/repositories/runner-credentials.ts");
  const credentialMigration = await readWorkspaceFile("supabase/migrations/20260703114000_create_runner_credentials.sql");

  for (const artifactKind of ["screenshot", "trace", "http_exchange", "email_receipt", "redacted_log"]) {
    assert.match(contract, new RegExp(`"${artifactKind}"`));
  }

  assert.match(journeyRunner, /artifactKind: "screenshot"/);
  assert.match(journeyRunner, /artifactKind: "run-artifact"/);
  assert.match(emailReceipts, /kind: "email_receipt"/);
  assert.match(integrationRunner, /kind: "http_exchange"/);
  assert.match(credentials, /createCipheriv\("aes-256-gcm"/);
  assert.match(credentials, /redactRunnerCredentialText/);
  assert.match(credentialRepository, /runnerCredentialSummarySelect/);
  assert.match(credentialRepository, /testRunnerCredential/);
  assert.match(credentialMigration, /alter table public\.runner_credentials force row level security/);
});

test("RAD-070 gate verifies Journey and Integration templates are runnable inputs", async () => {
  const journeyPacks = await readWorkspaceFile("src/lib/evaluation/journey-packs.ts");
  const genericChecks = await readWorkspaceFile("src/lib/evaluation/integration-checks.ts");
  const handoffTemplates = await readWorkspaceFile("src/lib/evaluation/handoff-templates.ts");
  const runnerSpec = await readWorkspaceFile("docs/RUNNERS_SPEC.md");

  assert.match(journeyPacks, /createTrialOnboardingJourneyDefinition/);
  assert.match(journeyPacks, /parseJourneyDefinition/);
  assert.match(genericChecks, /createGenericIntegrationCheckInput/);
  assert.match(genericChecks, /webhook_fired/);
  assert.match(genericChecks, /billing_object_updated/);
  assert.match(handoffTemplates, /createMinimalHandoffTestCaseBlueprint/);
  assert.match(handoffTemplates, /email-sent/);
  assert.match(handoffTemplates, /billing-status-changed/);
  assert.match(runnerSpec, /RAD-064/);
  assert.match(runnerSpec, /RAD-069/);
});

test("RAD-070 gate verifies Phase 6 completion and scope remain locked", async () => {
  const tasks = await readWorkspaceFile("tasks/TASKS.md");
  const routes = await readWorkspaceFile("src/lib/radar-routes.ts");
  const sidebar = await readWorkspaceFile("src/components/app-shell/sidebar-nav.tsx");
  const productScope = await readWorkspaceFile("docs/PRODUCT_SCOPE.md");
  const phaseSixSources = [
    await readWorkspaceFile("src/lib/evaluation/journey-runner.ts"),
    await readWorkspaceFile("src/lib/evaluation/journey-schema.ts"),
    await readWorkspaceFile("src/lib/evaluation/journey-packs.ts"),
    await readWorkspaceFile("src/lib/evaluation/email-receipts.ts"),
    await readWorkspaceFile("src/lib/evaluation/integration-runner.ts"),
    await readWorkspaceFile("src/lib/evaluation/integration-checks.ts"),
    await readWorkspaceFile("src/lib/evaluation/handoff-templates.ts"),
    await readWorkspaceFile("src/lib/credentials/runner-credentials.ts"),
  ];

  for (const ticket of ["RAD-061", "RAD-062", "RAD-063", "RAD-064", "RAD-065", "RAD-066", "RAD-067", "RAD-068", "RAD-069"]) {
    assert.match(tasks, new RegExp(`${ticket}[\\s\\S]*Done`));
  }

  assert.match(routes, /title: "Command Center"/);
  assert.match(routes, /title: "Assertions"/);
  assert.match(routes, /title: "Findings"/);
  assert.match(routes, /title: "Sources"/);
  assert.match(productScope, /Knowledge Runner, Journey Runner, Integration Runner/);
  assert.match(productScope, /Full integration marketplace/);
  assert.match(productScope, /Prompt playground/);
  assert.doesNotMatch(sidebar, /Prompt Playground|Trace Explorer|Workflow Canvas|Marketplace/i);

  for (const source of phaseSixSources) {
    assert.doesNotMatch(source, /generic eval platform|prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});
