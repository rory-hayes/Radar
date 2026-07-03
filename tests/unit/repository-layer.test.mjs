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

test("RAD-025 adds server-only typed repository modules for core records", async () => {
  for (const path of [
    "src/lib/repositories/client.ts",
    "src/lib/repositories/workspaces.ts",
    "src/lib/repositories/sources.ts",
    "src/lib/repositories/assertions.ts",
    "src/lib/repositories/evaluation.ts",
    "src/lib/repositories/findings.ts",
    "src/lib/repositories/index.ts",
  ]) {
    await fileExists(path);
    assert.match(await readWorkspaceFile(path), /server-only/);
  }

  const index = await readWorkspaceFile("src/lib/repositories/index.ts");

  assert.match(index, /repositories\/workspaces/);
  assert.match(index, /repositories\/sources/);
  assert.match(index, /repositories\/assertions/);
  assert.match(index, /repositories\/evaluation/);
  assert.match(index, /repositories\/findings/);
});

test("RAD-025 validates write inputs with shared Zod schemas", async () => {
  const sources = await readWorkspaceFile("src/lib/repositories/sources.ts");
  const assertions = await readWorkspaceFile("src/lib/repositories/assertions.ts");
  const evaluation = await readWorkspaceFile("src/lib/repositories/evaluation.ts");
  const findings = await readWorkspaceFile("src/lib/repositories/findings.ts");

  assert.match(sources, /sourceCreateRequestSchema\.parse/);
  assert.match(sources, /sourceVersionCreateRequestSchema\.parse/);
  assert.match(sources, /sourceDocumentCreateRequestSchema\.parse/);
  assert.match(sources, /sourceChunkCreateRequestSchema\.parse/);
  assert.match(assertions, /assertionCreateRequestSchema\.parse/);
  assert.match(assertions, /assertionSourceLinkRequestSchema\.parse/);
  assert.match(assertions, /assertionScheduleUpsertRequestSchema\.parse/);
  assert.match(assertions, /testCaseCreateRequestSchema\.parse/);
  assert.match(evaluation, /evaluationRunCreateRequestSchema\.parse/);
  assert.match(evaluation, /testCaseResultCreateRequestSchema\.parse/);
  assert.match(findings, /findingCreateRequestSchema\.parse/);
  assert.match(findings, /findingEvidenceCreateRequestSchema\.parse/);
  assert.match(findings, /findingAssignmentCreateRequestSchema\.parse/);
  assert.match(findings, /findingActivityCreateRequestSchema\.parse/);
});

test("RAD-025 keeps workspace scope explicit for product-table queries", async () => {
  const sources = await readWorkspaceFile("src/lib/repositories/sources.ts");
  const assertions = await readWorkspaceFile("src/lib/repositories/assertions.ts");
  const evaluation = await readWorkspaceFile("src/lib/repositories/evaluation.ts");
  const findings = await readWorkspaceFile("src/lib/repositories/findings.ts");

  for (const source of [sources, assertions, evaluation, findings]) {
    assert.match(source, /workspaceId: string/);
    assert.match(source, /workspace_id: workspaceId/);
    assert.match(source, /\.eq\("workspace_id", workspaceId\)/);
  }

  assert.doesNotMatch(sources, /service_role|sb_secret/i);
  assert.doesNotMatch(assertions, /service_role|sb_secret/i);
  assert.doesNotMatch(evaluation, /service_role|sb_secret/i);
  assert.doesNotMatch(findings, /service_role|sb_secret/i);
});

test("RAD-025 maps database rows into Radar domain types", async () => {
  const sources = await readWorkspaceFile("src/lib/repositories/sources.ts");
  const assertions = await readWorkspaceFile("src/lib/repositories/assertions.ts");
  const evaluation = await readWorkspaceFile("src/lib/repositories/evaluation.ts");
  const findings = await readWorkspaceFile("src/lib/repositories/findings.ts");

  assert.match(sources, /mapSourceRow\(row: SourceRow\): RadarSource/);
  assert.match(sources, /mapSourceChunkRow\(row: SourceChunkRow\): RadarSourceChunk/);
  assert.match(assertions, /mapAssertionRow\(row: AssertionRow\): RadarAssertion/);
  assert.match(assertions, /mapTestCaseRow\(row: TestCaseRow\): RadarTestCase/);
  assert.match(evaluation, /mapEvaluationRunRow\(row: EvaluationRunRow\): RadarEvaluationRun/);
  assert.match(evaluation, /mapTestCaseResultRow\(row: TestCaseResultRow\): RadarTestCaseResult/);
  assert.match(findings, /mapFindingRow\(row: FindingRow\): RadarFinding/);
  assert.match(findings, /mapFindingEvidenceRow\(row: FindingEvidenceRow\): RadarFindingEvidence/);
});

test("RAD-025 documents repository and guardrail responsibilities", async () => {
  const architecture = await readWorkspaceFile("docs/ARCHITECTURE.md");
  const security = await readWorkspaceFile("docs/SECURITY.md");

  assert.match(architecture, /Repository layer/);
  assert.match(architecture, /instead of scattering raw Supabase table queries/);
  assert.match(architecture, /not an authorization substitute/);
  assert.match(security, /Repository Boundary/);
  assert.match(security, /accept explicit workspace scope/);
  assert.match(security, /callers must enforce RBAC through server guardrails/);
});
