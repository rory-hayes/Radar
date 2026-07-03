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

test("RAD-026 creates a shared request and response validation contract", async () => {
  await fileExists("src/lib/validation/schemas.ts");
  await fileExists("src/lib/validation/index.ts");

  const schemas = await readWorkspaceFile("src/lib/validation/schemas.ts");
  const index = await readWorkspaceFile("src/lib/validation/index.ts");

  assert.match(index, /validation\/schemas/);
  assert.match(schemas, /workspaceCreateRequestSchema = createWorkspaceSchema/);
  assert.match(schemas, /workspaceUpdateSettingsRequestSchema = updateWorkspaceSettingsSchema/);
  assert.match(schemas, /sourceCreateRequestSchema = createSourceSchema/);
  assert.match(schemas, /sourceUpdateRequestSchema = createSourceSchema\.partial\(\)/);
  assert.match(schemas, /assertionCreateRequestSchema = createAssertionSchema/);
  assert.match(schemas, /assertionUpdateRequestSchema = createAssertionSchema\.partial\(\)/);
  assert.match(schemas, /testCaseCreateRequestSchema = testCaseSchema/);
  assert.match(schemas, /evaluationRunCreateRequestSchema = evaluationRunSchema/);
  assert.match(schemas, /testCaseResultCreateRequestSchema = testCaseResultSchema/);
  assert.match(schemas, /findingCreateRequestSchema = findingSchema/);
});

test("RAD-026 defines response schemas for every core data model object", async () => {
  const schemas = await readWorkspaceFile("src/lib/validation/schemas.ts");

  for (const schemaName of [
    "workspaceResponseSchema",
    "workspaceMembershipResponseSchema",
    "sourceResponseSchema",
    "sourceVersionResponseSchema",
    "sourceDocumentResponseSchema",
    "sourceChunkResponseSchema",
    "assertionResponseSchema",
    "assertionSourceResponseSchema",
    "assertionRunScheduleResponseSchema",
    "testCaseResponseSchema",
    "evaluationRunResponseSchema",
    "testCaseResultResponseSchema",
    "findingResponseSchema",
    "findingEvidenceResponseSchema",
    "findingAssignmentResponseSchema",
    "findingActivityResponseSchema",
  ]) {
    assert.match(schemas, new RegExp(`export const ${schemaName} = z\\.object`));
  }

  assert.match(schemas, /validationSuccessResponseSchema/);
  assert.match(schemas, /validationErrorResponseSchema/);
  assert.match(schemas, /validationListResponseSchema/);
});

test("RAD-026 repositories validate mapped responses before returning domain objects", async () => {
  const workspaces = await readWorkspaceFile("src/lib/repositories/workspaces.ts");
  const sources = await readWorkspaceFile("src/lib/repositories/sources.ts");
  const assertions = await readWorkspaceFile("src/lib/repositories/assertions.ts");
  const evaluation = await readWorkspaceFile("src/lib/repositories/evaluation.ts");
  const findings = await readWorkspaceFile("src/lib/repositories/findings.ts");

  assert.match(workspaces, /workspaceResponseSchema\.parse/);
  assert.match(workspaces, /workspaceMembershipResponseSchema\.parse/);
  assert.match(sources, /sourceResponseSchema\.parse/);
  assert.match(sources, /sourceVersionResponseSchema\.parse/);
  assert.match(sources, /sourceDocumentResponseSchema\.parse/);
  assert.match(sources, /sourceChunkResponseSchema\.parse/);
  assert.match(assertions, /assertionResponseSchema\.parse/);
  assert.match(assertions, /assertionSourceResponseSchema\.parse/);
  assert.match(assertions, /assertionRunScheduleResponseSchema\.parse/);
  assert.match(assertions, /testCaseResponseSchema\.parse/);
  assert.match(evaluation, /evaluationRunResponseSchema\.parse/);
  assert.match(evaluation, /testCaseResultResponseSchema\.parse/);
  assert.match(findings, /findingResponseSchema\.parse/);
  assert.match(findings, /findingEvidenceResponseSchema\.parse/);
  assert.match(findings, /findingAssignmentResponseSchema\.parse/);
  assert.match(findings, /findingActivityResponseSchema\.parse/);
});

test("RAD-026 keeps validation assertion-led and avoids out-of-scope platform language", async () => {
  const schemas = await readWorkspaceFile("src/lib/validation/schemas.ts");

  assert.match(schemas, /runnerTypes/);
  assert.match(schemas, /sourceTypes/);
  assert.match(schemas, /findingEvidenceTypes/);
  assert.doesNotMatch(schemas, /prompt_playground|trace_explorer|workflow_canvas|marketplace/i);
  assert.doesNotMatch(schemas, /service_role|sb_secret/i);
});
