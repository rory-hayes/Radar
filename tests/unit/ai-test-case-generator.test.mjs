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

test("RAD-048 adds a server-only OpenAI test case suggestion provider", async () => {
  await fileExists("src/lib/assertions/ai-test-cases.ts");

  const provider = await readWorkspaceFile("src/lib/assertions/ai-test-cases.ts");

  assert.match(provider, /server-only/);
  assert.match(provider, /defaultTestCaseSuggestionModel = "gpt-5\.2"/);
  assert.match(provider, /https:\/\/api\.openai\.com\/v1\/responses/);
  assert.match(provider, /Authorization: `Bearer \$\{apiKey\}`/);
  assert.match(provider, /type: "json_schema"/);
  assert.match(provider, /coverageNotes/);
  assert.match(provider, /parseTestCaseSuggestionResponse/);
  assert.match(provider, /buildTestCaseSuggestionPrompt/);
  assert.match(provider, /Use only the supplied assertion and source context/);
});

test("RAD-048 creates generated test cases as editable drafts from linked sources", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");

  assert.match(actions, /export async function generateSuggestedTestCasesAction/);
  assert.match(actions, /permission: "assertion:edit"/);
  assert.match(actions, /listAssertionSourcesForAssertion/);
  assert.match(actions, /listSourceChunksPreview/);
  assert.match(actions, /listTestCasesForAssertion/);
  assert.match(actions, /createOpenAITestCaseSuggestionProvider/);
  assert.match(actions, /Link at least one source before generating test cases/);
  assert.match(actions, /status: "draft"/);
  assert.match(actions, /generatedBy: "radar_ai_test_case_suggestion"/);
  assert.match(actions, /coverageNotes: suggestion\.coverageNotes/);
});

test("RAD-048 exposes generation from the assertion test case manager", async () => {
  const manager = await readWorkspaceFile("src/components/assertions/assertion-test-case-manager.tsx");

  assert.match(manager, /TestCaseSuggestionPanel/);
  assert.match(manager, /generateSuggestedTestCasesAction/);
  assert.match(manager, /Generate test case drafts/);
  assert.match(manager, /name="maxSuggestions"/);
  assert.match(manager, /Generated drafts remain editable and unapproved/);
  assert.match(manager, /Generate draft test cases/);
});

test("RAD-048 keeps generated test cases source-grounded and scope-safe", async () => {
  const provider = await readWorkspaceFile("src/lib/assertions/ai-test-cases.ts");
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");
  const manager = await readWorkspaceFile("src/components/assertions/assertion-test-case-manager.tsx");
  const task = await readWorkspaceFile("tasks/phase-4-assertions-testcases/rad-048-implement-ai-test-case-generator.md");

  assert.match(task, /Generated test cases include expected behaviour, coverage notes, and user-editable text/);
  assert.match(provider, /Do not duplicate existing test cases/);
  assert.match(actions, /Linked sources do not have enough context/);

  for (const source of [provider, actions, manager]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});
