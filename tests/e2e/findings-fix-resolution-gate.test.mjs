import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-080 gate verifies failures create evidence-backed findings with fixes", async () => {
  const creationEngine = await readWorkspaceFile("src/lib/findings/creation-engine.ts");
  const recommendedFixes = await readWorkspaceFile("src/lib/findings/recommended-fix-generator.ts");
  const severityModel = await readWorkspaceFile("src/lib/findings/severity-impact-model.ts");
  const findingsRepository = await readWorkspaceFile("src/lib/repositories/findings.ts");

  assert.match(creationEngine, /createOrUpdateFindingForResult/);
  assert.match(creationEngine, /actionableResultStatuses = \["failed", "warning"\]/);
  assert.match(creationEngine, /findingDedupeKey/);
  assert.match(creationEngine, /addFindingEvidence/);
  assert.match(creationEngine, /recordFindingActivity/);
  assert.match(creationEngine, /generateRecommendedFix/);
  assert.match(recommendedFixes, /recommendedFixGeneratorVersion = "rad-076"/);
  assert.match(recommendedFixes, /RecommendedFixGuardrail = "evidence_grounded" \| "runner_output_only" \| "insufficient_evidence"/);
  assert.match(recommendedFixes, /sourceEvidenceCount/);
  assert.match(severityModel, /severityImpactModelVersion = "rad-075"/);
  assert.match(severityModel, /customerImpact/);
  assert.match(findingsRepository, /createFinding/);
  assert.match(findingsRepository, /addFindingEvidence/);
  assert.match(findingsRepository, /\.eq\("workspace_id", workspaceId\)/);
});

test("RAD-080 gate verifies findings UI shows evidence, fix, owner, lifecycle, and rerun controls", async () => {
  const page = await readWorkspaceFile("src/app/(app)/findings/page.tsx");
  const detailPanel = await readWorkspaceFile("src/components/findings/finding-detail-panel.tsx");
  const inbox = await readWorkspaceFile("src/components/findings/finding-inbox.tsx");
  const evidenceDiff = await readWorkspaceFile("src/components/radar/evidence-diff.tsx");
  const lifecycleForm = await readWorkspaceFile("src/components/findings/finding-lifecycle-form.tsx");
  const ownershipForm = await readWorkspaceFile("src/components/findings/finding-ownership-form.tsx");
  const rerunForm = await readWorkspaceFile("src/components/findings/finding-rerun-form.tsx");

  assert.match(page, /listFindings/);
  assert.match(page, /listFindingEvidence/);
  assert.match(page, /listFindingActivity/);
  assert.match(page, /listActiveWorkspaceMembers/);
  assert.match(page, /membershipCan\(membership, "finding:resolve"\)/);
  assert.match(page, /membershipCan\(membership, "run:rerun"\)/);
  assert.match(detailPanel, /Expected vs actual/);
  assert.match(detailPanel, /Recommended fix/);
  assert.match(detailPanel, /FindingEvidenceList/);
  assert.match(detailPanel, /EvidenceDiff/);
  assert.match(detailPanel, /FindingLifecycleForm/);
  assert.match(detailPanel, /FindingOwnershipForm/);
  assert.match(detailPanel, /FindingRerunForm/);
  assert.match(inbox, /Evidence-backed exceptions prioritized/);
  assert.match(evidenceDiff, /Missing from actual/);
  assert.match(evidenceDiff, /Unsupported in source/);
  assert.match(lifecycleForm, /Update status/);
  assert.match(ownershipForm, /Owner/);
  assert.match(rerunForm, /Validate fix/);
});

test("RAD-080 gate verifies assignment, lifecycle resolution, and linked rerun persistence", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/findings/actions.ts");
  const lifecycle = await readWorkspaceFile("src/lib/findings/lifecycle-workflow.ts");
  const rerunResolution = await readWorkspaceFile("src/lib/findings/rerun-resolution.ts");
  const jobOrchestration = await readWorkspaceFile("src/lib/evaluation/job-orchestration.ts");
  const findingsRepository = await readWorkspaceFile("src/lib/repositories/findings.ts");
  const evaluationRepository = await readWorkspaceFile("src/lib/repositories/evaluation.ts");

  assert.match(actions, /updateFindingOwnershipAction/);
  assert.match(actions, /permission: "finding:resolve"/);
  assert.match(actions, /closeActiveFindingAssignments/);
  assert.match(actions, /assignFinding/);
  assert.match(actions, /activityType: ownerUserId \? "assigned" : "unassigned"/);
  assert.match(actions, /updateFindingLifecycleAction/);
  assert.match(actions, /updateFindingStatus/);
  assert.match(actions, /activityType: "status_changed"/);
  assert.match(actions, /queueFindingRerunAction/);
  assert.match(actions, /permission: "run:rerun"/);
  assert.match(actions, /activityType: "rerun_linked"/);
  assert.match(actions, /buildFindingRerunMetadata/);
  assert.match(lifecycle, /fixed: \["investigating", "resolved", "open"\]/);
  assert.match(lifecycle, /noteRequiredStatuses = \["resolved", "ignored", "false_positive"\]/);
  assert.match(rerunResolution, /findingRerunResolutionVersion = "rad-079"/);
  assert.match(rerunResolution, /resolutionMode: FindingRerunResolutionMode/);
  assert.match(rerunResolution, /toStatus: FindingStatus = rerun\.resolutionMode === "auto_resolve" \? "resolved" : "fixed"/);
  assert.match(jobOrchestration, /processFindingRerunResolutionForRun/);
  assert.match(findingsRepository, /resolved_at: parsedInput\.resolvedAt/);
  assert.match(findingsRepository, /resolution_summary: parsedInput\.resolutionSummary/);
  assert.match(evaluationRepository, /getTestCaseResultById/);
});

test("RAD-080 gate verifies workspace authorization and product scope remain locked", async () => {
  const routes = await readWorkspaceFile("src/lib/radar-routes.ts");
  const sidebar = await readWorkspaceFile("src/components/app-shell/sidebar-nav.tsx");
  const permissions = await readWorkspaceFile("src/lib/workspaces/permissions.ts");
  const guardrails = await readWorkspaceFile("src/lib/server/guardrails.ts");
  const findingsActions = await readWorkspaceFile("src/app/(app)/findings/actions.ts");
  const findingsPage = await readWorkspaceFile("src/app/(app)/findings/page.tsx");
  const productScope = await readWorkspaceFile("docs/PRODUCT_SCOPE.md");
  const tasks = await readWorkspaceFile("tasks/TASKS.md");
  const task = await readWorkspaceFile("tasks/phase-7-findings-fixes/rad-080-e2e-gate-8-failure-to-fix-to-resolved.md");

  assert.match(routes, /title: "Command Center"/);
  assert.match(routes, /title: "Assertions"/);
  assert.match(routes, /title: "Findings"/);
  assert.match(routes, /title: "Sources"/);
  assert.match(permissions, /editor: \[[\s\S]*?"run:rerun"[\s\S]*?"finding:resolve"/);
  assert.match(guardrails, /runWorkspaceServerAction/);
  assert.match(findingsActions, /runWorkspaceServerAction/);
  assert.match(findingsPage, /requireActiveWorkspace/);
  assert.match(productScope, /Full integration marketplace/);
  assert.match(productScope, /Prompt playground/);
  assert.match(productScope, /Trace explorer/);
  assert.match(tasks, /RAD-071[\s\S]*Done/);
  assert.match(tasks, /RAD-079[\s\S]*Done/);
  assert.match(tasks, /RAD-080[\s\S]*Done/);
  assert.match(task, /Gate report/);
  assert.match(task, /Result: Done/);
  assert.doesNotMatch(sidebar, /Prompt Playground|Trace Explorer|Workflow Canvas|Marketplace/i);

  for (const source of [routes, sidebar, findingsActions, findingsPage]) {
    assert.doesNotMatch(source, /generic eval platform|prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret|Bearer [A-Za-z0-9]/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});
