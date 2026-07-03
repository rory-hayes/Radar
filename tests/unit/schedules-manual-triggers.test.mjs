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

test("RAD-049 keeps schedule fields configurable on the assertion form", async () => {
  const form = await readWorkspaceFile("src/components/assertions/assertion-form.tsx");
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");

  assert.match(form, /FieldLegend>Schedule/);
  assert.match(form, /name="scheduleCadence"/);
  assert.match(form, /name="timezone"/);
  assert.match(form, /name="scheduleEnabled"/);
  assert.match(form, /name="sourceChangeTrigger"/);
  assert.match(actions, /scheduleCadence: z\.enum\(assertionScheduleCadences\)/);
  assert.match(actions, /upsertAssertionRunSchedule/);
});

test("RAD-049 queues manual verification without executing eval logic", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");

  assert.match(actions, /export async function queueManualAssertionRunAction/);
  assert.match(actions, /permission: "run:rerun"/);
  assert.match(actions, /listTestCasesForAssertion/);
  assert.match(actions, /status: "queued"/);
  assert.match(actions, /triggerType: "manual"/);
  assert.match(actions, /placeholder_until_runner_orchestration/);
  assert.match(actions, /Approve at least one test case before queueing a manual run/);
  assert.match(actions, /createEvaluationRun/);
});

test("RAD-049 exposes manual run controls on assertion detail", async () => {
  await fileExists("src/components/assertions/assertion-manual-run-panel.tsx");

  const page = await readWorkspaceFile("src/app/(app)/assertions/[assertionId]/page.tsx");
  const detail = await readWorkspaceFile("src/components/assertions/assertion-detail.tsx");
  const panel = await readWorkspaceFile("src/components/assertions/assertion-manual-run-panel.tsx");
  const index = await readWorkspaceFile("src/components/assertions/index.ts");

  assert.match(page, /membershipCan\(membership, "run:rerun"\)/);
  assert.match(page, /canRunAssertions=\{canRunAssertion\}/);
  assert.match(detail, /AssertionManualRunPanel/);
  assert.match(index, /AssertionManualRunPanel/);
  assert.match(panel, /Manual verification/);
  assert.match(panel, /Queue manual run/);
  assert.match(panel, /approvedTestCaseCount > 0/);
  assert.match(panel, /You do not have permission to queue runs/);
});

test("RAD-049 keeps manual triggers scoped and secret-safe", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");
  const panel = await readWorkspaceFile("src/components/assertions/assertion-manual-run-panel.tsx");
  const task = await readWorkspaceFile("tasks/phase-4-assertions-testcases/rad-049-implement-schedules-and-manual-triggers.md");

  assert.match(task, /Assertions can be configured for scheduled and manual verification/);

  for (const source of [actions, panel]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});
