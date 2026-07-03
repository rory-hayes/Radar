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

test("RAD-092 defines an assertion-led activation checklist contract", async () => {
  await fileExists("src/lib/onboarding/activation.ts");

  const activation = await readWorkspaceFile("src/lib/onboarding/activation.ts");

  assert.match(activation, /connect_source/);
  assert.match(activation, /create_assertion/);
  assert.match(activation, /configure_runner/);
  assert.match(activation, /run_check/);
  assert.match(activation, /review_result/);
  assert.match(activation, /approvedTestCaseCount/);
  assert.match(activation, /findings\.length > 0 \|\| runs\.some/);
  assert.doesNotMatch(activation, /marketplace|prompt playground|trace explorer|workflow canvas/i);
});

test("RAD-092 computes activation from real workspace repositories", async () => {
  const commandCenterPage = await readWorkspaceFile("src/app/(app)/command-center/page.tsx");
  const kpiSummary = await readWorkspaceFile("src/lib/command-center/kpi-summary.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/assertions.ts");

  assert.match(repository, /countApprovedTestCasesForWorkspace/);
  assert.match(repository, /\.from\("test_cases"\)/);
  assert.match(repository, /\.eq\("status", "approved"\)/);
  assert.match(commandCenterPage, /countApprovedTestCasesForWorkspace/);
  assert.match(commandCenterPage, /approvedTestCaseCount/);
  assert.match(kpiSummary, /buildActivationChecklist/);
  assert.match(kpiSummary, /activationChecklist: ActivationChecklist/);
});

test("RAD-092 surfaces activation on Command Center with shadcn primitives", async () => {
  const panel = await readWorkspaceFile("src/components/command-center/activation-checklist-panel.tsx");
  const summary = await readWorkspaceFile("src/components/command-center/command-center-kpi-summary.tsx");
  const index = await readWorkspaceFile("src/components/command-center/index.ts");

  assert.match(panel, /Card/);
  assert.match(panel, /Progress/);
  assert.match(panel, /Checkbox/);
  assert.match(panel, /Alert/);
  assert.match(panel, /Button/);
  assert.match(panel, /Locked/);
  assert.match(panel, /Activation complete/);
  assert.match(summary, /ActivationChecklistPanel/);
  assert.match(summary, /summary\.activationChecklist/);
  assert.match(index, /ActivationChecklistPanel/);
});

test("RAD-092 documents the onboarding activation flow and completion", async () => {
  const docs = await readWorkspaceFile("docs/ONBOARDING.md");
  const task = await readWorkspaceFile("tasks/phase-9-production-readiness/rad-092-build-onboarding-checklist-and-activation-flow.md");
  const tasks = await readWorkspaceFile("tasks/TASKS.md");

  assert.match(docs, /connect a source/);
  assert.match(docs, /approve runner coverage/);
  assert.match(docs, /weekly trust report/);
  assert.match(task, /Result: Done/);
  assert.match(task, /shadcn CLI fallback/);
  assert.match(tasks, /RAD-092[\s\S]*Done/);
});
