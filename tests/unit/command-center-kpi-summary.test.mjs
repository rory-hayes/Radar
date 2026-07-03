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

test("RAD-081 adds a real Command Center KPI summary model", async () => {
  await fileExists("src/lib/command-center/kpi-summary.ts");

  const summary = await readWorkspaceFile("src/lib/command-center/kpi-summary.ts");

  assert.match(summary, /buildCommandCenterKpiSummary/);
  assert.match(summary, /checksRun/);
  assert.match(summary, /exceptions/);
  assert.match(summary, /criticalIssues/);
  assert.match(summary, /recommendedFixes/);
  assert.match(summary, /passRate/);
  assert.match(summary, /trends/);
  assert.match(summary, /activeFindingStatuses = \["open", "investigating", "fixed"\]/);
  assert.match(summary, /isWithinDays\(run\.createdAt, now, 7, 0\)/);
});

test("RAD-081 replaces the Command Center placeholder with workspace data", async () => {
  const page = await readWorkspaceFile("src/app/(app)/command-center/page.tsx");
  const repository = await readWorkspaceFile("src/lib/repositories/evaluation.ts");

  assert.match(page, /requireActiveWorkspace/);
  assert.match(page, /createSupabaseServerClient/);
  assert.match(page, /listAssertions/);
  assert.match(page, /listFindings/);
  assert.match(page, /listEvaluationRunSummariesForWorkspace/);
  assert.match(page, /buildCommandCenterKpiSummary/);
  assert.match(page, /CommandCenterKpiSummary/);
  assert.match(page, /Command Center could not load/);
  assert.doesNotMatch(page, /RoutePlaceholder/);
  assert.match(repository, /export async function listEvaluationRunSummariesForWorkspace/);
  assert.match(repository, /\.eq\("workspace_id", workspaceId\)/);
});

test("RAD-081 renders enterprise shadcn KPI cards and empty/loading states", async () => {
  await fileExists("src/app/(app)/command-center/loading.tsx");

  const component = await readWorkspaceFile("src/components/command-center/command-center-kpi-summary.tsx");
  const loading = await readWorkspaceFile("src/app/(app)/command-center/loading.tsx");

  assert.match(component, /MetricCard/);
  assert.match(component, /Checks run/);
  assert.match(component, /Exceptions/);
  assert.match(component, /Critical issues/);
  assert.match(component, /Recommended fixes/);
  assert.match(component, /Pass rate/);
  assert.match(component, /Trend indicators/);
  assert.match(component, /Progress/);
  assert.match(component, /EmptyState/);
  assert.match(component, /Start in Assertions/);
  assert.match(loading, /LoadingState/);
  assert.match(loading, /checks, exceptions, pass rate, and trend indicators/);
});

test("RAD-081 documents Command Center scope and MCP usage", async () => {
  const task = await readWorkspaceFile("tasks/phase-8-dashboard-reports-alerts/rad-081-build-command-center-kpi-summary.md");
  const tasks = await readWorkspaceFile("tasks/TASKS.md");
  const component = await readWorkspaceFile("src/components/command-center/command-center-kpi-summary.tsx");

  assert.match(task, /Result: Done/);
  assert.match(task, /shadcnio MCP/);
  assert.match(tasks, /RAD-081[\s\S]*Done/);
  assert.doesNotMatch(component, /generic eval platform|prompt playground|trace explorer|workflow canvas|integration marketplace/i);
});
