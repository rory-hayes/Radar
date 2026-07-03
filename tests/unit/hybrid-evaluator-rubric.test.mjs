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

test("RAD-056 adds a server-only hybrid evaluator rubric", async () => {
  await fileExists("src/lib/evaluation/hybrid-rubric.ts");

  const rubric = await readWorkspaceFile("src/lib/evaluation/hybrid-rubric.ts");

  assert.match(rubric, /server-only/);
  assert.match(rubric, /export const hybridRubricVersion = "rad-056"/);
  assert.match(rubric, /export async function evaluateKnowledgeAnswer/);
  assert.match(rubric, /HybridEvaluationResult/);
  assert.match(rubric, /hybridRubricDimensionIds/);
});

test("RAD-056 scores all required deterministic dimensions before LLM blending", async () => {
  const rubric = await readWorkspaceFile("src/lib/evaluation/hybrid-rubric.ts");

  for (const dimension of [
    "source_grounding",
    "contradiction_detection",
    "completeness",
    "refusal_behaviour",
    "citation_validity",
    "policy_consistency",
  ]) {
    assert.match(rubric, new RegExp(dimension));
  }

  assert.match(rubric, /scoreRubricDimensions/);
  assert.match(rubric, /weightedScore/);
  assert.match(rubric, /dimensionWeights/);
  assert.match(rubric, /contradictionScore/);
  assert.match(rubric, /refusalScore/);
  assert.match(rubric, /citationScore/);
});

test("RAD-056 integrates the versioned LLM judge without making it the sole signal", async () => {
  const rubric = await readWorkspaceFile("src/lib/evaluation/hybrid-rubric.ts");
  const promptContracts = await readWorkspaceFile("src/lib/evaluation/llm-prompt-contracts.ts");

  assert.match(rubric, /evaluationJudgePromptContract/);
  assert.match(rubric, /createOpenAIHybridEvaluatorJudgeProvider/);
  assert.match(rubric, /createHybridEvaluatorJudgeProvider/);
  assert.match(rubric, /parseHybridJudgeResponse/);
  assert.match(rubric, /deterministicScore \* 0\.65 \+ judge\.score \* 0\.35/);
  assert.match(rubric, /buildEvaluationJudgePrompt/);
  assert.match(promptContracts, /id: "evaluation_judge"/);
});

test("RAD-056 prevents evidence-free findings and critical LLM-only verdicts", async () => {
  const rubric = await readWorkspaceFile("src/lib/evaluation/hybrid-rubric.ts");

  assert.match(rubric, /evidenceCount === 0/);
  assert.match(rubric, /return "inconclusive"/);
  assert.match(rubric, /No source evidence was attached/);
  assert.match(rubric, /shouldRecommendFinding/);
  assert.match(rubric, /if \(evidenceCount === 0 \|\| confidence < 0\.55\)/);
  assert.match(rubric, /Do not recommend a finding when there is no supporting evidence/);
});

test("RAD-056 documents the rubric and stays within Radar scope", async () => {
  const evalSpec = await readWorkspaceFile("docs/EVAL_ENGINE_SPEC.md");
  const task = await readWorkspaceFile("tasks/phase-5-eval-knowledge-runner/rad-056-implement-hybrid-evaluator-rubric.md");
  const rubric = await readWorkspaceFile("src/lib/evaluation/hybrid-rubric.ts");

  assert.match(evalSpec, /RAD-056/);
  assert.match(evalSpec, /hybrid evaluator rubric/);
  assert.match(task, /hybrid evaluator rubric/);

  for (const source of [rubric]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
    assert.doesNotMatch(source, /apiKey|secretKey|accessToken|refreshToken|service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});
