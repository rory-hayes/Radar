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

test("RAD-046 adds a server-only OpenAI assertion suggestion provider", async () => {
  await fileExists("src/lib/assertions/ai-suggestions.ts");

  const provider = await readWorkspaceFile("src/lib/assertions/ai-suggestions.ts");
  const llmProvider = await readWorkspaceFile("src/lib/llm/openai-responses.ts");

  assert.match(provider, /server-only/);
  assert.match(provider, /defaultAssertionSuggestionModel = "gpt-5\.2"/);
  assert.match(provider, /createOpenAIJsonProvider/);
  assert.match(provider, /version: promptContract\.version/);
  assert.match(llmProvider, /https:\/\/api\.openai\.com\/v1\/responses/);
  assert.match(llmProvider, /Authorization: `Bearer \$\{apiKey\}`/);
  assert.match(llmProvider, /type: "json_schema"/);
  assert.match(provider, /suggestedAssertionDraftSchema/);
  assert.match(provider, /parseSuggestionResponse/);
  assert.match(provider, /buildSuggestionPrompt/);
  assert.match(provider, /Use only the supplied source context/);
});

test("RAD-046 creates draft assertions from selected workspace sources only", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");

  assert.match(actions, /export async function generateSuggestedAssertionDraftsAction/);
  assert.match(actions, /permission: "assertion:create"/);
  assert.match(actions, /assertionSuggestionActionSchema/);
  assert.match(actions, /listSources/);
  assert.match(actions, /listSourceChunksPreview/);
  assert.match(actions, /createOpenAIAssertionSuggestionProvider/);
  assert.match(actions, /status: "draft"/);
  assert.match(actions, /generatedBy: "radar_ai_suggestion"/);
  assert.match(actions, /replaceAssertionSourcesForAssertion/);
  assert.match(actions, /redirect\("\/assertions\?status=draft"\)/);
});

test("RAD-046 exposes an editor-triggered generator on the create page", async () => {
  await fileExists("src/components/assertions/assertion-suggestion-generator.tsx");

  const page = await readWorkspaceFile("src/app/(app)/assertions/new/page.tsx");
  const component = await readWorkspaceFile("src/components/assertions/assertion-suggestion-generator.tsx");

  assert.match(page, /AssertionSuggestionGenerator sources=\{sources\}/);
  assert.match(component, /useActionState/);
  assert.match(component, /generateSuggestedAssertionDraftsAction/);
  assert.match(component, /Suggest assertions from sources/);
  assert.match(component, /Drafts must be reviewed before activation/);
  assert.match(component, /name="sourceIds"/);
  assert.match(component, /name="maxSuggestions"/);
  assert.match(component, /Generate draft assertions/);
});

test("RAD-046 keeps AI suggestions assertion-led and secret-safe", async () => {
  const provider = await readWorkspaceFile("src/lib/assertions/ai-suggestions.ts");
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");
  const component = await readWorkspaceFile("src/components/assertions/assertion-suggestion-generator.tsx");
  const task = await readWorkspaceFile("tasks/phase-4-assertions-testcases/rad-046-implement-ai-suggested-assertion-generator.md");

  assert.match(task, /AI suggestions are reviewable drafts/);

  for (const source of [provider, actions, component]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});
