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

test("RAD-052 adds a server-only OpenAI Responses JSON provider", async () => {
  await fileExists("src/lib/llm/openai-responses.ts");

  const provider = await readWorkspaceFile("src/lib/llm/openai-responses.ts");

  assert.match(provider, /server-only/);
  assert.match(provider, /defaultOpenAIResponsesModel = "gpt-5\.2"/);
  assert.match(provider, /export function createOpenAIJsonProvider/);
  assert.match(provider, /https:\/\/api\.openai\.com\/v1\/responses/);
  assert.match(provider, /Authorization: `Bearer \$\{apiKey\}`/);
  assert.match(provider, /type: "json_schema"/);
  assert.match(provider, /strict: request\.contract\.responseFormat\.strict/);
  assert.match(provider, /parseOpenAIJsonPayload/);
  assert.match(provider, /OpenAIResponsesError/);
});

test("RAD-052 defines strict versioned prompt contracts and redacted log metadata", async () => {
  const contracts = await readWorkspaceFile("src/lib/llm/prompt-contracts.ts");

  assert.match(contracts, /radarLlmTasks = \["generation", "judging", "summarization", "fix_recommendation"\]/);
  assert.match(contracts, /createRadarLlmPromptContract/);
  assert.match(contracts, /promptId: input\.contract\.id/);
  assert.match(contracts, /promptVersion: input\.contract\.version/);
  assert.match(contracts, /inputFingerprint: fingerprintPromptInput/);
  assert.match(contracts, /createHash\("sha256"\)/);
  assert.doesNotMatch(contracts, /apiKey|Authorization|Bearer/);
});

test("RAD-052 provides Phase 5 judging summarization and fix prompt contracts", async () => {
  const promptContracts = await readWorkspaceFile("src/lib/evaluation/llm-prompt-contracts.ts");
  const evalSpec = await readWorkspaceFile("docs/EVAL_ENGINE_SPEC.md");

  assert.match(promptContracts, /evaluationJudgePromptContract/);
  assert.match(promptContracts, /task: "judging"/);
  assert.match(promptContracts, /evaluationSummaryPromptContract/);
  assert.match(promptContracts, /task: "summarization"/);
  assert.match(promptContracts, /recommendedFixPromptContract/);
  assert.match(promptContracts, /task: "fix_recommendation"/);
  assert.match(promptContracts, /Do not create critical findings without evidence/);
  assert.match(evalSpec, /RAD-052 introduces a server-only LLM adapter/);
  assert.match(evalSpec, /prompt id, prompt version, task, response format, input fingerprint/);
});

test("RAD-052 migrates existing generation providers onto the shared adapter", async () => {
  const assertions = await readWorkspaceFile("src/lib/assertions/ai-suggestions.ts");
  const testCases = await readWorkspaceFile("src/lib/assertions/ai-test-cases.ts");
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");

  for (const source of [assertions, testCases]) {
    assert.match(source, /createOpenAIJsonProvider/);
    assert.match(source, /createRadarLlmPromptContract/);
    assert.match(source, /prompt: \{/);
    assert.match(source, /promptContract\.version/);
  }

  assert.match(actions, /promptId: provider\.prompt\.id/);
  assert.match(actions, /promptVersion: provider\.prompt\.version/);
});

test("RAD-052 keeps LLM contracts server-only and product-scoped", async () => {
  const files = [
    await readWorkspaceFile("src/lib/llm/openai-responses.ts"),
    await readWorkspaceFile("src/lib/llm/prompt-contracts.ts"),
    await readWorkspaceFile("src/lib/evaluation/llm-prompt-contracts.ts"),
    await readWorkspaceFile("src/lib/assertions/ai-suggestions.ts"),
    await readWorkspaceFile("src/lib/assertions/ai-test-cases.ts"),
  ];

  for (const source of files) {
    assert.match(source, /server-only/);
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});
