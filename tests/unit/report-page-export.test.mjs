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

test("RAD-086 adds a guarded weekly report detail page", async () => {
  await fileExists("src/app/(app)/reports/weekly/page.tsx");
  await fileExists("src/app/(app)/reports/weekly/loading.tsx");

  const page = await readWorkspaceFile("src/app/(app)/reports/weekly/page.tsx");
  const loading = await readWorkspaceFile("src/app/(app)/reports/weekly/loading.tsx");

  assert.match(page, /requireActiveWorkspace/);
  assert.match(page, /createSupabaseServerClient/);
  assert.match(page, /listAssertions/);
  assert.match(page, /listFindings/);
  assert.match(page, /listEvaluationRunSummariesForWorkspace/);
  assert.match(page, /generateWeeklyTrustReport/);
  assert.match(page, /buildWeeklyTrustReportExportPayload/);
  assert.match(page, /WeeklyTrustReportDetail/);
  assert.match(page, /Report could not load/);
  assert.match(loading, /LoadingState/);
  assert.match(loading, /checks, exceptions, resolved findings, risky categories, and export sections/);
});

test("RAD-086 defines export-ready report blocks for future PDF and email delivery", async () => {
  await fileExists("src/lib/reports/report-export.ts");

  const exportScaffold = await readWorkspaceFile("src/lib/reports/report-export.ts");

  assert.match(exportScaffold, /ReportExportPayload/);
  assert.match(exportScaffold, /schemaVersion: "radar\.report-export\.v1"/);
  assert.match(exportScaffold, /artifactKind: "report-export"/);
  assert.match(exportScaffold, /formats: \["json", "pdf", "email"\]/);
  assert.match(exportScaffold, /type: "paragraph"/);
  assert.match(exportScaffold, /type: "metrics"/);
  assert.match(exportScaffold, /type: "risk_categories"/);
  assert.match(exportScaffold, /type: "findings"/);
  assert.match(exportScaffold, /type: "next_actions"/);
  assert.match(exportScaffold, /suggestedFileName/);
});

test("RAD-086 renders report sections and JSON download without adding primary navigation", async () => {
  await fileExists("src/components/reports/weekly-trust-report-detail.tsx");

  const detail = await readWorkspaceFile("src/components/reports/weekly-trust-report-detail.tsx");
  const commandCenterPanel = await readWorkspaceFile("src/components/command-center/weekly-trust-report-panel.tsx");
  const routes = await readWorkspaceFile("src/lib/radar-routes.ts");
  const primaryRoutes = routes.match(/export const primaryAppRoutes = \[([\s\S]*?)\] as const;/)?.[1];

  assert.match(detail, /WeeklyTrustReportDetail/);
  assert.match(detail, /Export scaffold/);
  assert.match(detail, /Export-ready JSON/);
  assert.match(detail, /download=\{exportPayload\.suggestedFileName\}/);
  assert.match(detail, /Risky categories/);
  assert.match(detail, /Open exceptions/);
  assert.match(detail, /Resolved findings/);
  assert.match(detail, /Recommended next actions/);
  assert.match(commandCenterPanel, /href="\/reports\/weekly"/);
  assert.match(routes, /weeklyReportRoute/);
  assert.match(routes, /href: "\/reports\/weekly"/);
  assert.match(routes, /hiddenFromPrimaryNav: true/);
  assert.ok(primaryRoutes, "primaryAppRoutes should be declared");
  assert.doesNotMatch(primaryRoutes, /reports/);
  assert.doesNotMatch(detail, /generic eval platform|prompt playground|trace explorer|workflow canvas|integration marketplace/i);
});

test("RAD-086 documents completion and validation", async () => {
  const task = await readWorkspaceFile("tasks/phase-8-dashboard-reports-alerts/rad-086-build-report-page-and-export-scaffold.md");
  const tasks = await readWorkspaceFile("tasks/TASKS.md");

  assert.match(task, /Result: Done/);
  assert.match(task, /report detail page/);
  assert.match(task, /Docker daemon/);
  assert.match(tasks, /RAD-086[\s\S]*Done/);
});
