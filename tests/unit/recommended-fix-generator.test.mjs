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

test("RAD-076 adds a server-only recommended fix generator", async () => {
  await fileExists("src/lib/findings/recommended-fix-generator.ts");

  const generator = await readWorkspaceFile("src/lib/findings/recommended-fix-generator.ts");

  assert.match(generator, /server-only/);
  assert.match(generator, /recommendedFixGeneratorVersion = "rad-076"/);
  assert.match(generator, /generateRecommendedFix/);
  assert.match(generator, /RecommendedFixGuardrail/);
  assert.match(generator, /RecommendedFixFailureType/);
});

test("RAD-076 grounds fixes in runner type failure type owner and evidence state", async () => {
  const generator = await readWorkspaceFile("src/lib/findings/recommended-fix-generator.ts");

  assert.match(generator, /fixForRunner/);
  assert.match(generator, /runnerType === "knowledge"/);
  assert.match(generator, /runnerType === "journey"/);
  assert.match(generator, /Integration check/);
  assert.match(generator, /classifyFailure/);
  assert.match(generator, /blocked_or_unavailable/);
  assert.match(generator, /missing_required_content/);
  assert.match(generator, /mismatch_or_contradiction/);
  assert.match(generator, /sourceOwnerPhrase/);
  assert.match(generator, /ownerUserId/);
  assert.match(generator, /summarizeEvidence/);
});

test("RAD-076 enforces a no-hallucination guardrail without model calls", async () => {
  const generator = await readWorkspaceFile("src/lib/findings/recommended-fix-generator.ts");

  assert.match(generator, /guardrailForEvidence/);
  assert.match(generator, /evidence_grounded/);
  assert.match(generator, /runner_output_only/);
  assert.match(generator, /insufficient_evidence/);
  assert.match(generator, /bounded runner output only/);
  assert.doesNotMatch(generator, /createRadarLlmProvider|callOpenAi|responses\.create|promptContract|recommendedFixPromptContract/);
  assert.doesNotMatch(generator, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
  assert.doesNotMatch(generator, /console\.log|console\.error/);
});

test("RAD-076 writes fix generator metadata through finding creation", async () => {
  const engine = await readWorkspaceFile("src/lib/findings/creation-engine.ts");

  assert.match(engine, /generateRecommendedFix\(input\)/);
  assert.match(engine, /recommendedFix: recommendedFix\.recommendedFix/);
  assert.match(engine, /recommendedFixGeneratorVersion/);
  assert.match(engine, /recommendedFixGuardrail/);
  assert.match(engine, /recommendedFixFailureType/);
  assert.match(engine, /recommendedFixEvidenceCount/);
  assert.match(engine, /recommendedFixRationale/);
});

test("RAD-076 documents the recommended fix contract without expanding product scope", async () => {
  const evalSpec = await readWorkspaceFile("docs/EVAL_ENGINE_SPEC.md");
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");

  assert.match(evalSpec, /RAD-076 adds a deterministic recommended fix generator/);
  assert.match(evalSpec, /no-hallucination guardrail/);
  assert.match(dataModel, /RAD-076 stores recommended-fix generator metadata/);
  assert.match(evalSpec, /does not add a prompt playground or generic eval surface/);
});
