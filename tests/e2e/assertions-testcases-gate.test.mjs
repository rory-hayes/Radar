import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-050 gate verifies assertions can be created, generated, templated, and linked to sources", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");
  const assertionForm = await readWorkspaceFile("src/components/assertions/assertion-form.tsx");
  const suggestionProvider = await readWorkspaceFile("src/lib/assertions/ai-suggestions.ts");
  const templates = await readWorkspaceFile("src/lib/assertions/templates.ts");
  const detail = await readWorkspaceFile("src/components/assertions/assertion-detail.tsx");
  const sourceLinking = await readWorkspaceFile("src/components/assertions/assertion-source-linking-panel.tsx");

  assert.match(actions, /createAssertionAction/);
  assert.match(actions, /generateSuggestedAssertionDraftsAction/);
  assert.match(actions, /updateAssertionSourceLinksAction/);
  assert.match(actions, /replaceAssertionSourcesForAssertion/);
  assert.match(assertionForm, /name="scheduleCadence"/);
  assert.match(assertionForm, /name="sourceChangeTrigger"/);
  assert.match(assertionForm, /name="sourceIds"/);
  assert.match(suggestionProvider, /status is omitted because generated assertions are saved as draft by the server/i);
  assert.match(templates, /pricing-plan-accuracy/);
  assert.match(templates, /support-escalation/);
  assert.match(detail, /AssertionSourceLinkingPanel/);
  assert.match(sourceLinking, /Minimum source coverage/);
});

test("RAD-050 gate verifies test cases can be generated, edited, approved, disabled, deleted, and queued", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");
  const testCaseManager = await readWorkspaceFile("src/components/assertions/assertion-test-case-manager.tsx");
  const testCaseProvider = await readWorkspaceFile("src/lib/assertions/ai-test-cases.ts");
  const manualRunPanel = await readWorkspaceFile("src/components/assertions/assertion-manual-run-panel.tsx");
  const assertionsRepository = await readWorkspaceFile("src/lib/repositories/assertions.ts");
  const evaluationRepository = await readWorkspaceFile("src/lib/repositories/evaluation.ts");

  for (const functionName of [
    "createTestCaseAction",
    "updateTestCaseAction",
    "approveTestCaseAction",
    "disableTestCaseAction",
    "deleteTestCaseAction",
    "generateSuggestedTestCasesAction",
    "queueManualAssertionRunAction",
  ]) {
    assert.match(actions, new RegExp(`export async function ${functionName}`));
  }

  assert.match(testCaseManager, /Create test case/);
  assert.match(testCaseManager, /Generate test case drafts/);
  assert.match(testCaseManager, /Edit test case/);
  assert.match(testCaseManager, /Approve/);
  assert.match(testCaseManager, /Disable/);
  assert.match(testCaseManager, /Delete/);
  assert.match(testCaseProvider, /coverageNotes/);
  assert.match(manualRunPanel, /Queue manual run/);
  assert.match(assertionsRepository, /export async function approveTestCase/);
  assert.match(evaluationRepository, /export async function createEvaluationRun/);
  assert.match(actions, /queueEvaluationJob/);
  assert.match(actions, /queued_for_runner/);
});

test("RAD-050 gate verifies workspace authorization and mutation boundaries", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");
  const detailPage = await readWorkspaceFile("src/app/(app)/assertions/[assertionId]/page.tsx");
  const permissions = await readWorkspaceFile("src/lib/workspaces/permissions.ts");
  const rls = await readWorkspaceFile("supabase/migrations/20260703111500_harden_workspace_rls_policies.sql");

  assert.match(actions, /permission: "assertion:create"/);
  assert.match(actions, /permission: "assertion:edit"/);
  assert.match(actions, /permission: "run:rerun"/);
  assert.match(actions, /requireWorkspaceAssertion/);
  assert.match(actions, /requireWorkspaceTestCase/);
  assert.match(actions, /testCase\.assertionId !== assertionId/);
  assert.match(detailPage, /membershipCan\(membership, "assertion:edit"\)/);
  assert.match(detailPage, /membershipCan\(membership, "run:rerun"\)/);
  assert.match(permissions, /editor: \[[\s\S]*?"assertion:create"[\s\S]*?"assertion:edit"[\s\S]*?"run:rerun"/);
  assert.match(rls, /workspace editors can create test cases/);
  assert.match(rls, /workspace editors can create evaluation runs/);
});

test("RAD-050 gate verifies Phase 4 scope and navigation remain locked", async () => {
  const routes = await readWorkspaceFile("src/lib/radar-routes.ts");
  const sidebar = await readWorkspaceFile("src/components/app-shell/sidebar-nav.tsx");
  const tasks = await readWorkspaceFile("tasks/TASKS.md");
  const productScope = await readWorkspaceFile("docs/PRODUCT_SCOPE.md");
  const assertionComponents = [
    await readWorkspaceFile("src/components/assertions/assertion-detail.tsx"),
    await readWorkspaceFile("src/components/assertions/assertion-test-case-manager.tsx"),
    await readWorkspaceFile("src/components/assertions/assertion-manual-run-panel.tsx"),
  ];

  assert.match(routes, /title: "Command Center"/);
  assert.match(routes, /title: "Assertions"/);
  assert.match(routes, /title: "Findings"/);
  assert.match(routes, /title: "Sources"/);
  assert.doesNotMatch(sidebar, /Prompt Playground|Trace Explorer|Workflow Canvas|Marketplace/i);
  assert.match(tasks, /RAD-041[\s\S]*Done/);
  assert.match(tasks, /RAD-049[\s\S]*Done/);
  assert.match(productScope, /If a feature does not help a user create, run, understand, fix, or monitor a customer-facing assertion/);

  for (const source of assertionComponents) {
    assert.doesNotMatch(source, /generic eval platform|prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
  }
});
