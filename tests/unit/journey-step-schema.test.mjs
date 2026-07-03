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

test("RAD-063 adds a declarative journey definition schema", async () => {
  await fileExists("src/lib/evaluation/journey-schema.ts");

  const schema = await readWorkspaceFile("src/lib/evaluation/journey-schema.ts");

  assert.match(schema, /journeyDefinitionVersion = "rad-063"/);
  assert.match(schema, /journeyDefinitionSchema/);
  assert.match(schema, /journeyStepDefinitionSchema/);
  assert.match(schema, /parseJourneyDefinition/);
  assert.match(schema, /safeJourneyStepSummary/);
  assert.match(schema, /steps: z\.array\(journeyStepDefinitionSchema\)\.min\(1\)\.max\(50\)/);
});

test("RAD-063 covers the allowed Journey step types without adding a workflow canvas", async () => {
  const schema = await readWorkspaceFile("src/lib/evaluation/journey-schema.ts");
  const task = await readWorkspaceFile("tasks/phase-6-journey-integration-runners/rad-063-create-journey-step-definition-schema.md");

  for (const stepType of [
    "visit_url",
    "click",
    "fill_text",
    "assert_text",
    "assert_url",
    "wait",
    "verify_email",
    "screenshot",
    "success_condition",
  ]) {
    assert.match(schema, new RegExp(`"${stepType}"`));
  }

  assert.match(schema, /z\.discriminatedUnion\("type"/);
  assert.doesNotMatch(schema, /workflow canvas|visual builder|marketplace/i);
  assert.match(task, /without building a visual workflow canvas/);
});

test("RAD-063 uses safe locators and credential references for text entry", async () => {
  const schema = await readWorkspaceFile("src/lib/evaluation/journey-schema.ts");

  assert.match(schema, /journeyLocatorSchema/);
  assert.match(schema, /css: boundedSelectorSchema\.optional\(\)/);
  assert.match(schema, /text: boundedTextSchema\.optional\(\)/);
  assert.match(schema, /role: z\.string\(\)\.trim\(\)/);
  assert.match(schema, /testId: z\.string\(\)\.trim\(\)/);
  assert.match(schema, /journeyInputValueSchema/);
  assert.match(schema, /kind: z\.literal\("credential_ref"\)/);
  assert.match(schema, /kind: z\.literal\("literal"\)/);
});

test("RAD-063 documents Journey success conditions and scope boundaries", async () => {
  const schema = await readWorkspaceFile("src/lib/evaluation/journey-schema.ts");
  const runnerSpec = await readWorkspaceFile("docs/RUNNERS_SPEC.md");

  for (const conditionType of [
    "url_contains",
    "text_visible",
    "email_received",
    "element_visible",
  ]) {
    assert.match(schema, new RegExp(`"${conditionType}"`));
  }

  assert.match(schema, /Journey step ids must be unique/);
  assert.match(runnerSpec, /RAD-063 defines a declarative journey step schema/);
  assert.match(runnerSpec, /The schema supports URL visits, clicks, text entry, assertions, waits, email checks, screenshots, and success conditions/);

  assert.match(runnerSpec, /not a visual workflow canvas/);
  assert.doesNotMatch(schema, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
  assert.doesNotMatch(schema, /console\.log|console\.error/);
});
