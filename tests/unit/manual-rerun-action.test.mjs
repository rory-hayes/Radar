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

test("RAD-059 adds a typed manual rerun metadata contract", async () => {
  await fileExists("src/lib/evaluation/manual-reruns.ts");

  const manualReruns = await readWorkspaceFile("src/lib/evaluation/manual-reruns.ts");

  assert.match(manualReruns, /manualRerunMetadataVersion = "rad-059"/);
  assert.match(manualReruns, /scope: ManualRerunScope/);
  assert.match(manualReruns, /testCaseId\?: string/);
  assert.match(manualReruns, /buildManualRerunMetadata/);
  assert.match(manualReruns, /readManualRerunRequest/);
  assert.match(manualReruns, /filterManualRerunTestCases/);
  assert.match(manualReruns, /runnerTestCaseTypes/);
});

test("RAD-059 validates assertion and targeted test-case reruns server-side", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");

  assert.match(actions, /testCaseId: optionalTrimmedString\.pipe\(z\.uuid\(\)\.optional\(\)\)/);
  assert.match(actions, /permission: "run:rerun"/);
  assert.match(actions, /requireWorkspaceAssertion/);
  assert.match(actions, /approvedRunnableTestCasesForRunner/);
  assert.match(actions, /input\.testCaseId && !requestedTestCase/);
  assert.match(actions, /The selected test case must be approved and runnable for this assertion/);
  assert.match(actions, /totalTestCases: queuedTestCases\.length/);
  assert.match(actions, /queuedBy: "rad-059_manual_rerun_action"/);
  assert.match(actions, /buildManualRerunMetadata/);
});

test("RAD-059 lets the Knowledge Runner execute only a targeted failed test case", async () => {
  const runner = await readWorkspaceFile("src/lib/evaluation/knowledge-runner.ts");

  assert.match(runner, /readManualRerunRequest\(run\.executionMetadata\)/);
  assert.match(runner, /filterManualRerunTestCases\(approvedKnowledgeTestCases, manualRerun\)/);
  assert.match(runner, /manual_rerun_test_case_not_runnable/);
  assert.match(runner, /The targeted manual rerun test case is no longer approved or runnable/);
  assert.match(runner, /manualRerun/);
});

test("RAD-059 surfaces failed-case rerun controls with status feedback", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");
  const page = await readWorkspaceFile("src/app/(app)/assertions/[assertionId]/page.tsx");
  const detail = await readWorkspaceFile("src/components/assertions/assertion-detail.tsx");
  const panel = await readWorkspaceFile("src/components/assertions/assertion-manual-run-panel.tsx");
  const task = await readWorkspaceFile("tasks/phase-5-eval-knowledge-runner/rad-059-implement-manual-rerun-action.md");

  assert.match(page, /listTestCaseResultsForRun/);
  assert.match(page, /loadFailedTestCaseRerunCandidates/);
  assert.match(detail, /failedTestCaseRerunCandidates/);
  assert.match(panel, /StatusBadge/);
  assert.match(panel, /Rerun failed case/);
  assert.match(actions, /Targeted test case rerun queued/);
  assert.match(panel, /name="testCaseId"/);
  assert.match(task, /no new shadcn block was installed/);

  for (const source of [panel, detail]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});
