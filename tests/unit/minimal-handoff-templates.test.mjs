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

test("RAD-068 adds minimal handoff templates", async () => {
  await fileExists("src/lib/evaluation/handoff-templates.ts");

  const templates = await readWorkspaceFile("src/lib/evaluation/handoff-templates.ts");

  assert.match(templates, /server-only/);
  assert.match(templates, /minimalHandoffTemplateVersion = "rad-068"/);
  assert.match(templates, /minimalHandoffTemplateSlugs/);
  assert.match(templates, /minimalHandoffTemplates/);
  assert.match(templates, /createMinimalHandoffDefinition/);
  assert.match(templates, /createMinimalHandoffTestCaseBlueprint/);
});

test("RAD-068 covers the required handoff template slugs", async () => {
  const templates = await readWorkspaceFile("src/lib/evaluation/handoff-templates.ts");

  for (const slug of [
    "email-sent",
    "support-ticket-created",
    "crm-task-created",
    "webhook-event-received",
    "billing-status-changed",
  ]) {
    assert.match(templates, new RegExp(`"${slug}"`));
  }

  assert.match(templates, /Email Sent/);
  assert.match(templates, /Support Ticket Created/);
  assert.match(templates, /CRM Task Created/);
  assert.match(templates, /Webhook Event Received/);
  assert.match(templates, /Billing Status Changed/);
});

test("RAD-068 compiles handoff templates to generic Integration checks", async () => {
  const templates = await readWorkspaceFile("src/lib/evaluation/handoff-templates.ts");
  const genericChecks = await readWorkspaceFile("src/lib/evaluation/integration-checks.ts");

  assert.match(templates, /createGenericIntegrationTestCaseBlueprint/);
  assert.match(templates, /genericIntegrationCheckDefinitionSchema\.parse/);
  assert.match(templates, /kind: "api_expected_state"/);
  assert.match(templates, /kind: "ticket_endpoint_accepted"/);
  assert.match(templates, /kind: "webhook_fired"/);
  assert.match(templates, /kind: "billing_object_updated"/);
  assert.match(genericChecks, /createGenericIntegrationCheckInput/);
});

test("RAD-068 keeps handoff templates source-minimal and configurable", async () => {
  const templates = await readWorkspaceFile("src/lib/evaluation/handoff-templates.ts");

  assert.match(templates, /requiredConfiguration/);
  assert.match(templates, /expectedStatus/);
  assert.match(templates, /acceptableStatuses/);
  assert.match(templates, /responseContains/);
  assert.match(templates, /jsonPath/);
  assert.match(templates, /jsonEquals/);
  assert.match(templates, /auth: integrationAuthSchema/);
  assert.match(templates, /headers: boundedHeadersSchema/);
});

test("RAD-068 documents templates without adding integration marketplace scope", async () => {
  const templates = await readWorkspaceFile("src/lib/evaluation/handoff-templates.ts");
  const runnerSpec = await readWorkspaceFile("docs/RUNNERS_SPEC.md");

  assert.match(runnerSpec, /RAD-068 adds minimal handoff templates/);
  assert.match(runnerSpec, /email-sent/);
  assert.match(runnerSpec, /billing-status-changed/);

  assert.doesNotMatch(templates, /stripe|salesforce|hubspot|zendesk|intercom|slack/i);
  assert.doesNotMatch(templates, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
  assert.doesNotMatch(templates, /console\.log|console\.error/);
});
