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

test("RAD-047 adds repository mutations for test case CRUD and lifecycle", async () => {
  const assertions = await readWorkspaceFile("src/lib/repositories/assertions.ts");
  const validation = await readWorkspaceFile("src/lib/validation/schemas.ts");

  assert.match(assertions, /export async function createTestCase/);
  assert.match(assertions, /export async function updateTestCase/);
  assert.match(assertions, /export async function approveTestCase/);
  assert.match(assertions, /export async function disableTestCase/);
  assert.match(assertions, /export async function deleteTestCase/);
  assert.match(assertions, /approved_by: approvedBy/);
  assert.match(assertions, /approved_at: new Date\(\)\.toISOString\(\)/);
  assert.match(assertions, /\.from\("test_cases"\)\.delete\(\)\.eq\("workspace_id", workspaceId\)\.eq\("id", testCaseId\)/);
  assert.match(validation, /testCaseUpdateRequestSchema = testCaseSchema\.partial\(\)/);
});

test("RAD-047 server actions enforce assertion edit permission and assertion ownership", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");

  assert.match(actions, /export async function createTestCaseAction/);
  assert.match(actions, /export async function updateTestCaseAction/);
  assert.match(actions, /export async function approveTestCaseAction/);
  assert.match(actions, /export async function disableTestCaseAction/);
  assert.match(actions, /export async function deleteTestCaseAction/);
  assert.match(actions, /permission: "assertion:edit"/);
  assert.match(actions, /requireWorkspaceAssertion/);
  assert.match(actions, /requireWorkspaceTestCase/);
  assert.match(actions, /testCase\.assertionId !== assertionId/);
  assert.match(actions, /status: "draft"/);
  assert.doesNotMatch(actions, /service_role|sb_secret/i);
  assert.doesNotMatch(actions, /console\.log|console\.error/);
});

test("RAD-047 exposes explicit test case management on assertion detail", async () => {
  await fileExists("src/components/assertions/assertion-test-case-manager.tsx");

  const page = await readWorkspaceFile("src/app/(app)/assertions/[assertionId]/page.tsx");
  const detail = await readWorkspaceFile("src/components/assertions/assertion-detail.tsx");
  const manager = await readWorkspaceFile("src/components/assertions/assertion-test-case-manager.tsx");
  const index = await readWorkspaceFile("src/components/assertions/index.ts");

  assert.match(page, /canEditTestCases=\{canEditAssertion\}/);
  assert.match(detail, /AssertionTestCaseManager/);
  assert.match(index, /AssertionTestCaseManager/);
  assert.match(manager, /Create test case/);
  assert.match(manager, /Edit test case/);
  assert.match(manager, /Approve/);
  assert.match(manager, /Disable/);
  assert.match(manager, /Delete/);
  assert.match(manager, /No test cases configured/);
  assert.match(manager, /useActionState/);
});

test("RAD-047 keeps test cases inspectable and out of generic eval scope", async () => {
  const manager = await readWorkspaceFile("src/components/assertions/assertion-test-case-manager.tsx");
  const task = await readWorkspaceFile("tasks/phase-4-assertions-testcases/rad-047-build-test-case-crud.md");

  assert.match(task, /Test cases are explicit, inspectable/);
  assert.match(manager, /customer-facing language/);
  assert.match(manager, /Approval and disabling remain explicit actions/);

  for (const source of [manager]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
  }
});
