import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-060 gate verifies the Knowledge eval path from target configuration to scored result", async () => {
  const targetConfig = await readWorkspaceFile("src/lib/evaluation/knowledge-targets.ts");
  const runner = await readWorkspaceFile("src/lib/evaluation/knowledge-runner.ts");
  const rubric = await readWorkspaceFile("src/lib/evaluation/hybrid-rubric.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/evaluation.ts");
  const migration = await readWorkspaceFile("supabase/migrations/20260703105000_create_evaluation_runs_and_results.sql");

  assert.match(targetConfig, /loadKnowledgeTargetConfigurationsForAssertion/);
  assert.match(targetConfig, /support_bot_endpoint/);
  assert.match(targetConfig, /uploaded_answer_set/);
  assert.match(targetConfig, /manual_answer_set/);
  assert.match(runner, /runNextKnowledgeEvaluationJob/);
  assert.match(runner, /loadEvaluationEvidence/);
  assert.match(runner, /defaultKnowledgeTargetClient/);
  assert.match(runner, /evaluateKnowledgeAnswer/);
  assert.match(runner, /createTestCaseResult/);
  assert.match(rubric, /contradiction_detection/);
  assert.match(rubric, /No source evidence was attached, so Radar cannot make an evidence-backed finding/);
  assert.match(repository, /actual_summary: parsedInput\.actualSummary/);
  assert.match(repository, /evaluator_summary: parsedInput\.evaluatorSummary/);
  assert.match(repository, /evidence_refs: parsedInput\.evidenceRefs/);
  assert.match(migration, /constraint test_case_results_run_case_unique unique \(evaluation_run_id, test_case_id\)/);
});

test("RAD-060 gate verifies run summaries and failed reruns are traceable in the assertion UI", async () => {
  const detailPage = await readWorkspaceFile("src/app/(app)/assertions/[assertionId]/page.tsx");
  const detail = await readWorkspaceFile("src/components/assertions/assertion-detail.tsx");
  const manualRunPanel = await readWorkspaceFile("src/components/assertions/assertion-manual-run-panel.tsx");
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");
  const manualReruns = await readWorkspaceFile("src/lib/evaluation/manual-reruns.ts");

  assert.match(detailPage, /listEvaluationRunSummariesForAssertion/);
  assert.match(detailPage, /listTestCaseResultsForRun/);
  assert.match(detailPage, /loadFailedTestCaseRerunCandidates/);
  assert.match(detail, /TabsTrigger value="runs"/);
  assert.match(detail, /label="Latest pass rate"/);
  assert.match(detail, /First failure/);
  assert.match(manualRunPanel, /StatusBadge/);
  assert.match(manualRunPanel, /Rerun failed case/);
  assert.match(actions, /permission: "run:rerun"/);
  assert.match(actions, /queuedBy: "rad-059_manual_rerun_action"/);
  assert.match(manualReruns, /manualRerunMetadataVersion = "rad-059"/);
  assert.match(manualReruns, /filterManualRerunTestCases/);
});

test("RAD-060 gate verifies workspace authorization and product scope remain locked", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");
  const runner = await readWorkspaceFile("src/lib/evaluation/knowledge-runner.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/evaluation.ts");
  const permissions = await readWorkspaceFile("src/lib/workspaces/permissions.ts");
  const routes = await readWorkspaceFile("src/lib/radar-routes.ts");
  const sidebar = await readWorkspaceFile("src/components/app-shell/sidebar-nav.tsx");
  const tasks = await readWorkspaceFile("tasks/TASKS.md");
  const productScope = await readWorkspaceFile("docs/PRODUCT_SCOPE.md");

  assert.match(actions, /runWorkspaceServerAction/);
  assert.match(actions, /permission: "run:rerun"/);
  assert.match(repository, /\.eq\("workspace_id", workspaceId\)/);
  assert.match(runner, /run\.workspaceId/);
  assert.match(permissions, /"run:rerun"/);
  assert.match(routes, /title: "Command Center"/);
  assert.match(routes, /title: "Assertions"/);
  assert.match(routes, /title: "Findings"/);
  assert.match(routes, /title: "Sources"/);
  assert.match(tasks, /RAD-054[\s\S]*Done/);
  assert.match(tasks, /RAD-059[\s\S]*Done/);
  assert.match(productScope, /Full integration marketplace/);
  assert.match(productScope, /Prompt playground/);
  assert.match(productScope, /Trace explorer/);
  assert.match(productScope, /Full low-code workflow builder/);
  assert.doesNotMatch(sidebar, /Prompt Playground|Trace Explorer|Workflow Canvas|Marketplace/i);

  for (const source of [actions, runner, repository, routes, sidebar]) {
    assert.doesNotMatch(source, /generic eval platform|prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret|apiKey|Bearer [A-Za-z0-9]/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});
