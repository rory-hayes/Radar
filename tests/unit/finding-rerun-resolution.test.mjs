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

test("RAD-079 adds linked finding rerun metadata and resolution processing", async () => {
  await fileExists("src/lib/findings/rerun-resolution.ts");

  const helper = await readWorkspaceFile("src/lib/findings/rerun-resolution.ts");

  assert.match(helper, /server-only/);
  assert.match(helper, /findingRerunResolutionVersion = "rad-079"/);
  assert.match(helper, /findingRerunResolutionModes = \["suggest", "auto_resolve"\]/);
  assert.match(helper, /buildFindingRerunMetadata/);
  assert.match(helper, /readFindingRerunMetadata/);
  assert.match(helper, /processFindingRerunResolutionForRun/);
  assert.match(helper, /isPassingRerun/);
});

test("RAD-079 processes completed passing jobs through finding resolution helper", async () => {
  const orchestration = await readWorkspaceFile("src/lib/evaluation/job-orchestration.ts");

  assert.match(orchestration, /processFindingRerunResolutionForRun/);
  assert.match(orchestration, /await processFindingRerunResolutionForRun\(client, input\.workspaceId, completedRun\)/);
});

test("RAD-079 can load original test-case results for targeted finding reruns", async () => {
  const repository = await readWorkspaceFile("src/lib/repositories/evaluation.ts");

  assert.match(repository, /getTestCaseResultById/);
  assert.match(repository, /\.from\("test_case_results"\)/);
  assert.match(repository, /\.eq\("workspace_id", workspaceId\)/);
  assert.match(repository, /\.eq\("id", testCaseResultId\)/);
});

test("RAD-079 queues a guarded finding rerun and records activity", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/findings/actions.ts");

  assert.match(actions, /queueFindingRerunAction/);
  assert.match(actions, /permission: "run:rerun"/);
  assert.match(actions, /getFindingById/);
  assert.match(actions, /getTestCaseResultById/);
  assert.match(actions, /approvedRunnableTestCasesForRunner/);
  assert.match(actions, /queueEvaluationJob/);
  assert.match(actions, /buildFindingRerunMetadata/);
  assert.match(actions, /activityType: "rerun_linked"/);
  assert.match(actions, /queuedBy: "rad-079_finding_rerun_action"/);
});

test("RAD-079 renders fix validation controls on finding detail", async () => {
  await fileExists("src/components/findings/finding-rerun-form.tsx");

  const form = await readWorkspaceFile("src/components/findings/finding-rerun-form.tsx");
  const panel = await readWorkspaceFile("src/components/findings/finding-detail-panel.tsx");
  const page = await readWorkspaceFile("src/app/(app)/findings/page.tsx");

  assert.match(form, /FindingRerunForm/);
  assert.match(form, /queueFindingRerunAction/);
  assert.match(form, /Validate fix/);
  assert.match(form, /Run permission required/);
  assert.match(panel, /FindingRerunForm/);
  assert.match(page, /membershipCan\(membership, "run:rerun"\)/);
});

test("RAD-079 documents rerun resolution without adding unrelated scope", async () => {
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");
  const evalSpec = await readWorkspaceFile("docs/EVAL_ENGINE_SPEC.md");
  const task = await readWorkspaceFile("tasks/phase-7-findings-fixes/rad-079-implement-rerun-after-fix-and-resolution-linking.md");

  assert.match(dataModel, /RAD-079 links finding validation reruns/);
  assert.match(evalSpec, /RAD-079 links finding-triggered reruns/);
  assert.match(task, /Result: Done/);
});
