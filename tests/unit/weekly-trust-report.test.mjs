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

test("RAD-085 adds an export-ready weekly trust report generator", async () => {
  await fileExists("src/lib/reports/weekly-trust-report.ts");

  const report = await readWorkspaceFile("src/lib/reports/weekly-trust-report.ts");

  assert.match(report, /generateWeeklyTrustReport/);
  assert.match(report, /WeeklyTrustReport/);
  assert.match(report, /checksRun/);
  assert.match(report, /passRate/);
  assert.match(report, /activeExceptions/);
  assert.match(report, /resolvedFindingsCount/);
  assert.match(report, /riskyCategories/);
  assert.match(report, /recommendedNextActions/);
  assert.match(report, /executiveSummary/);
  assert.match(report, /lookbackDays = 7/);
});

test("RAD-085 derives report content from assertions runs and findings", async () => {
  const report = await readWorkspaceFile("src/lib/reports/weekly-trust-report.ts");

  assert.match(report, /periodRuns = runs\.filter/);
  assert.match(report, /terminalRunStatuses/);
  assert.match(report, /activeFindingStatuses/);
  assert.match(report, /finding\.resolvedAt/);
  assert.match(report, /passRateForRuns\(periodRuns\)/);
  assert.match(report, /buildRiskyCategories/);
  assert.match(report, /selectOpenExceptions/);
  assert.match(report, /buildRecommendedNextActions/);
  assert.doesNotMatch(report, /generic eval platform|prompt playground|trace explorer|workflow canvas|integration marketplace/i);
});

test("RAD-085 exposes the weekly report on Command Center with shadcn primitives", async () => {
  await fileExists("src/components/command-center/weekly-trust-report-panel.tsx");

  const summary = await readWorkspaceFile("src/lib/command-center/kpi-summary.ts");
  const component = await readWorkspaceFile("src/components/command-center/command-center-kpi-summary.tsx");
  const panel = await readWorkspaceFile("src/components/command-center/weekly-trust-report-panel.tsx");
  const index = await readWorkspaceFile("src/components/command-center/index.ts");

  assert.match(summary, /generateWeeklyTrustReport/);
  assert.match(summary, /weeklyTrustReport: generateWeeklyTrustReport/);
  assert.match(component, /WeeklyTrustReportPanel report=\{summary\.weeklyTrustReport\}/);
  assert.match(index, /weekly-trust-report-panel/);
  assert.match(panel, /Card/);
  assert.match(panel, /Button/);
  assert.match(panel, /Separator/);
  assert.match(panel, /StatusBadge/);
  assert.match(panel, /Weekly trust report/);
  assert.match(panel, /Risky categories/);
  assert.match(panel, /Recommended next actions/);
});

test("RAD-085 documents completion and validation", async () => {
  const task = await readWorkspaceFile("tasks/phase-8-dashboard-reports-alerts/rad-085-implement-weekly-trust-report-generator.md");
  const tasks = await readWorkspaceFile("tasks/TASKS.md");

  assert.match(task, /Result: Done/);
  assert.match(task, /weekly trust report generator/);
  assert.match(task, /Docker daemon/);
  assert.match(tasks, /RAD-085[\s\S]*Done/);
});
