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

test("RAD-053 adds a server-only evaluation evidence loader", async () => {
  await fileExists("src/lib/evaluation/evidence-loading.ts");

  const loader = await readWorkspaceFile("src/lib/evaluation/evidence-loading.ts");

  assert.match(loader, /server-only/);
  assert.match(loader, /export async function loadEvaluationEvidence/);
  assert.match(loader, /EvaluationEvidenceLoadInput/);
  assert.match(loader, /EvaluationEvidenceContext/);
  assert.match(loader, /EvaluationEvidenceLoadingError/);
});

test("RAD-053 validates assertion and test case workspace scope", async () => {
  const loader = await readWorkspaceFile("src/lib/evaluation/evidence-loading.ts");

  assert.match(loader, /getAssertionById/);
  assert.match(loader, /getTestCaseById/);
  assert.match(loader, /Assertion was not found in this workspace/);
  assert.match(loader, /testCase\.assertionId !== assertion\.id/);
  assert.match(loader, /Test case was not found for this assertion/);
  assert.match(loader, /workspaceId: input\.workspaceId/);
});

test("RAD-053 restricts retrieval to assertion-linked sources", async () => {
  const loader = await readWorkspaceFile("src/lib/evaluation/evidence-loading.ts");
  const retrieval = await readWorkspaceFile("src/lib/evidence/retrieval.ts");

  assert.match(loader, /listAssertionSourcesForAssertion/);
  assert.match(loader, /selectLinkedSourceIds/);
  assert.match(loader, /Requested source is not linked to this assertion/);
  assert.match(loader, /sourceIds: selectedSourceIds/);
  assert.match(loader, /retrieveEvidenceForAssertion/);
  assert.match(retrieval, /matchAssertionSourceChunks/);
});

test("RAD-053 builds test-case evidence queries and evaluation evidence refs", async () => {
  const loader = await readWorkspaceFile("src/lib/evaluation/evidence-loading.ts");

  assert.match(loader, /buildEvaluationEvidenceQuery/);
  assert.match(loader, /Assertion: \$\{assertion\.title\}/);
  assert.match(loader, /Expected behavior: \$\{assertion\.expectedBehavior\}/);
  assert.match(loader, /Test case: \$\{testCase\.title\}/);
  assert.match(loader, /Expected result: \$\{testCase\.expectedResult\}/);
  assert.match(loader, /evidenceRefs: retrieval\.matches\.map\(matchToEvidenceRef\)/);
  assert.match(loader, /sourceChunkId: match\.citation\.chunkId/);
  assert.match(loader, /score: match\.score/);
});

test("RAD-053 attaches source snapshots for explainable evaluation context", async () => {
  const loader = await readWorkspaceFile("src/lib/evaluation/evidence-loading.ts");
  const evalSpec = await readWorkspaceFile("docs/EVAL_ENGINE_SPEC.md");

  assert.match(loader, /listSourceVersions/);
  assert.match(loader, /listSourceDocuments/);
  assert.match(loader, /latestVersion/);
  assert.match(loader, /documents: documents\.map/);
  assert.match(loader, /contentHash: latestVersion\.contentHash/);
  assert.match(loader, /contentHash: document\.contentHash/);
  assert.match(evalSpec, /RAD-053 adds a server-only evaluation evidence loader/);
  assert.match(evalSpec, /not a generic workspace search surface/);
});

test("RAD-053 keeps evidence loading assertion-led and secret-safe", async () => {
  const loader = await readWorkspaceFile("src/lib/evaluation/evidence-loading.ts");

  assert.doesNotMatch(loader, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
  assert.doesNotMatch(loader, /service_role|sb_secret/i);
  assert.doesNotMatch(loader, /console\.log|console\.error/);
});
