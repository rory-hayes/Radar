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

test("RAD-075 adds a server-only severity and customer impact model", async () => {
  await fileExists("src/lib/findings/severity-impact-model.ts");

  const model = await readWorkspaceFile("src/lib/findings/severity-impact-model.ts");

  assert.match(model, /server-only/);
  assert.match(model, /severityImpactModelVersion = "rad-075"/);
  assert.match(model, /assessSeverityAndImpact/);
  assert.match(model, /SeverityImpactAssessment/);
  assert.match(model, /nextFindingRepeatCount/);
});

test("RAD-075 combines priority failure type journey confidence repeat and customer signals", async () => {
  const model = await readWorkspaceFile("src/lib/findings/severity-impact-model.ts");

  assert.match(model, /priorityScore/);
  assert.match(model, /input\.status === "failed"/);
  assert.match(model, /input\.runnerType === "journey"/);
  assert.match(model, /input\.runnerType === "integration"/);
  assert.match(model, /input\.confidence >= 0\.85/);
  assert.match(model, /input\.repeatCount >= 5/);
  assert.match(model, /input\.repeatCount >= 3/);
  assert.match(model, /customerFacingSignal/);
  assert.match(model, /affectedJourneySignal/);
  assert.match(model, /hasExplicitBlocker/);
});

test("RAD-075 writes risk factors and repeat counts through finding creation", async () => {
  const engine = await readWorkspaceFile("src/lib/findings/creation-engine.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/findings.ts");

  assert.match(engine, /assessSeverityAndImpact/);
  assert.match(engine, /nextFindingRepeatCount\(existing\)/);
  assert.match(engine, /severity: risk\.severity/);
  assert.match(engine, /customerImpact: risk\.customerImpact/);
  assert.match(engine, /severityImpactModelVersion/);
  assert.match(engine, /impactLevel: risk\.impactLevel/);
  assert.match(engine, /repeatCount: risk\.repeatCount/);
  assert.match(engine, /riskFactors: risk\.factors/);
  assert.match(repository, /dedupe_key, first_seen_at, last_seen_at, resolved_at, resolved_by_user_id, resolution_summary, metadata/);
});

test("RAD-075 exposes bounded metadata on finding responses for repeat scoring", async () => {
  const schema = await readWorkspaceFile("src/lib/findings/schema.ts");
  const validation = await readWorkspaceFile("src/lib/validation/schemas.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/findings.ts");

  assert.match(schema, /metadata\?: Record<string, unknown>/);
  assert.match(validation, /metadata: radarJsonRecordSchema\.optional\(\)/);
  assert.match(repository, /metadata: row\.metadata/);
  assert.match(repository, /metadata: JsonRecord/);
});

test("RAD-075 documents business-risk prioritization without adding unrelated scope", async () => {
  const model = await readWorkspaceFile("src/lib/findings/severity-impact-model.ts");
  const evalSpec = await readWorkspaceFile("docs/EVAL_ENGINE_SPEC.md");
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");

  assert.match(evalSpec, /RAD-075 adds a severity and customer impact model/);
  assert.match(dataModel, /RAD-075 records severity-impact metadata/);
  assert.doesNotMatch(model, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
  assert.doesNotMatch(model, /console\.log|console\.error/);
});
