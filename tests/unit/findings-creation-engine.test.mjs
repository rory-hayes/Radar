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

test("RAD-071 adds a server-only findings creation engine", async () => {
  await fileExists("src/lib/findings/creation-engine.ts");

  const engine = await readWorkspaceFile("src/lib/findings/creation-engine.ts");

  assert.match(engine, /server-only/);
  assert.match(engine, /findingCreationEngineVersion = "rad-071"/);
  assert.match(engine, /createOrUpdateFindingForResult/);
  assert.match(engine, /findingInputFromResult/);
  assert.match(engine, /findingDedupeKey/);
  assert.match(engine, /severityForResult/);
});

test("RAD-071 converts only failed and warning results into findings", async () => {
  const engine = await readWorkspaceFile("src/lib/findings/creation-engine.ts");

  assert.match(engine, /actionableResultStatuses = \["failed", "warning"\]/);
  assert.match(engine, /reason: "non_actionable_status"/);
  assert.match(engine, /reason: "workspace_mismatch"/);
  assert.match(engine, /isWorkspaceConsistent/);
  assert.match(engine, /input\.testCase\.assertionId === input\.assertion\.id/);
  assert.match(engine, /input\.result\.testCaseId === input\.testCase\.id/);
});

test("RAD-071 creates or updates deduplicated findings", async () => {
  const engine = await readWorkspaceFile("src/lib/findings/creation-engine.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/findings.ts");

  assert.match(engine, /getFindingByDedupeKey/);
  assert.match(engine, /updateFindingOccurrence/);
  assert.match(engine, /createFinding/);
  assert.match(engine, /shouldUpdateExisting/);
  assert.match(engine, /firstSeenAt: now/);
  assert.match(engine, /lastSeenAt: now/);
  assert.match(engine, /firstSeenPreserved: true/);
  assert.match(engine, /stableFailureFingerprint/);

  assert.match(repository, /getFindingByDedupeKey/);
  assert.match(repository, /\.eq\("workspace_id", workspaceId\)[\s\S]*?\.eq\("dedupe_key", dedupeKey\)/);
  assert.match(repository, /updateFindingOccurrence/);
  assert.match(repository, /last_seen_at: input\.lastSeenAt/);
  assert.match(repository, /\.eq\("workspace_id", workspaceId\)[\s\S]*?\.eq\("id", findingId\)/);
});

test("RAD-071 wires finding creation into persisted runner results", async () => {
  const knowledgeRunner = await readWorkspaceFile("src/lib/evaluation/knowledge-runner.ts");
  const integrationRunner = await readWorkspaceFile("src/lib/evaluation/integration-runner.ts");

  assert.match(knowledgeRunner, /createOrUpdateFindingForResult/);
  assert.match(knowledgeRunner, /await createOrUpdateFindingForResult\(client, \{ workspaceId: run\.workspaceId, assertion, testCase, run, result \}\)/);
  assert.match(integrationRunner, /createOrUpdateFindingForResult/);
  assert.match(integrationRunner, /await createOrUpdateFindingForResult\(client, \{ workspaceId: run\.workspaceId, assertion, testCase, run, result \}\)/);
  assert.match(integrationRunner, /evidenceRefs: \[\{ storagePath: artifact\.storagePath, citation: artifact\.label \}\]/);
});

test("RAD-071 maps severity confidence impact and evidence", async () => {
  const engine = await readWorkspaceFile("src/lib/findings/creation-engine.ts");

  assert.match(engine, /assessSeverityAndImpact/);
  assert.match(engine, /severityImpactModelVersion/);
  assert.match(engine, /boundedConfidence/);
  assert.match(engine, /customerImpact: risk\.customerImpact/);
  assert.match(engine, /repeatCount: risk\.repeatCount/);
  assert.match(engine, /generateRecommendedFix/);
  assert.match(engine, /recommendedFix: recommendedFix\.recommendedFix/);
  assert.match(engine, /addFindingEvidence/);
  assert.match(engine, /recordFindingActivity/);
  assert.match(engine, /evidenceType: "run_output"/);
  assert.match(engine, /evidenceType: "source_chunk"/);
  assert.match(engine, /evidenceType: "source_document"/);
  assert.match(engine, /evidenceType: ref\.storagePath \? "artifact" : "run_output"/);
});

test("RAD-071 documents the findings creation contract without adding unrelated scope", async () => {
  const engine = await readWorkspaceFile("src/lib/findings/creation-engine.ts");
  const evalSpec = await readWorkspaceFile("docs/EVAL_ENGINE_SPEC.md");
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");

  assert.match(evalSpec, /RAD-071 adds the findings creation engine/);
  assert.match(evalSpec, /failed or warning `test_case_results`/);
  assert.match(dataModel, /RAD-071 keeps duplicate runner failures/);
  assert.match(dataModel, /first_seen_at/);
  assert.match(dataModel, /last_seen_at/);

  assert.doesNotMatch(engine, /console\.log|console\.error/);
  assert.doesNotMatch(engine, /service_role|sb_secret|SUPABASE_SERVICE_ROLE/i);
  assert.doesNotMatch(engine, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
});
