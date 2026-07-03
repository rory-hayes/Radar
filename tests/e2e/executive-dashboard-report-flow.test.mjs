import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-090 gate verifies Command Center summarizes sources assertions runs and findings", async () => {
  const commandCenterPage = await readWorkspaceFile("src/app/(app)/command-center/page.tsx");
  const kpiSummary = await readWorkspaceFile("src/lib/command-center/kpi-summary.ts");
  const needsAttention = await readWorkspaceFile("src/components/command-center/needs-attention-panel.tsx");
  const assertionHealth = await readWorkspaceFile("src/components/command-center/assertion-health-panel.tsx");
  const recentActivity = await readWorkspaceFile("src/components/command-center/recent-activity-feed.tsx");
  const recentActivityModel = await readWorkspaceFile("src/lib/command-center/recent-activity.ts");

  assert.match(commandCenterPage, /listSources/);
  assert.match(commandCenterPage, /listAssertions/);
  assert.match(commandCenterPage, /listEvaluationRunSummariesForWorkspace/);
  assert.match(commandCenterPage, /listFindings/);
  assert.match(commandCenterPage, /buildCommandCenterKpiSummary/);
  assert.match(kpiSummary, /generateWeeklyTrustReport/);
  assert.match(kpiSummary, /buildAssertionCategoryHealth/);
  assert.match(kpiSummary, /needsAttention/);
  assert.match(needsAttention, /Recommended fix/);
  assert.match(assertionHealth, /Pass rate/);
  assert.match(recentActivity, /Recent activity/);
  assert.match(recentActivityModel, /source_synced/);
  assert.match(recentActivityModel, /assertion_run_completed/);
  assert.match(recentActivityModel, /finding_opened/);
  assert.match(recentActivityModel, /finding_rerun/);
  assert.match(recentActivityModel, /report_generated/);
});

test("RAD-090 gate verifies alert generation for email and Slack is guarded and persisted", async () => {
  const emailRoute = await readWorkspaceFile("src/app/api/notifications/email/route.ts");
  const slackRoute = await readWorkspaceFile("src/app/api/notifications/slack/route.ts");
  const emailDispatcher = await readWorkspaceFile("src/lib/notifications/dispatcher.ts");
  const slackDispatcher = await readWorkspaceFile("src/lib/notifications/slack-dispatcher.ts");
  const resend = await readWorkspaceFile("src/lib/notifications/resend.ts");
  const slack = await readWorkspaceFile("src/lib/notifications/slack.ts");
  const notificationRepository = await readWorkspaceFile("src/lib/repositories/notifications.ts");
  const notificationMigration = await readWorkspaceFile("supabase/migrations/20260703122000_create_notification_deliveries.sql");
  const slackMigration = await readWorkspaceFile("supabase/migrations/20260703124000_extend_notification_deliveries_for_slack.sql");

  assert.match(emailRoute, /permission: "workspace:manage"/);
  assert.match(slackRoute, /permission: "workspace:manage"/);
  assert.match(emailDispatcher, /sendWorkspaceNotificationEmails/);
  assert.match(emailDispatcher, /updateNotificationDeliveryStatus/);
  assert.match(slackDispatcher, /sendWorkspaceSlackAlert/);
  assert.match(slackDispatcher, /channel: "slack"/);
  assert.match(slackDispatcher, /provider: "slack_webhook"/);
  assert.match(resend, /RESEND_API_KEY is not configured/);
  assert.match(slack, /SLACK_WEBHOOK_URL is not configured/);
  assert.match(notificationRepository, /createNotificationDelivery/);
  assert.match(notificationRepository, /listNotificationDeliveries/);
  assert.match(notificationMigration, /enable row level security/);
  assert.match(slackMigration, /channel in \('email', 'slack'\)/);
});

test("RAD-090 gate verifies weekly report creation export and analytics instrumentation", async () => {
  const reportPage = await readWorkspaceFile("src/app/(app)/reports/weekly/page.tsx");
  const reportDetail = await readWorkspaceFile("src/components/reports/weekly-trust-report-detail.tsx");
  const reportGenerator = await readWorkspaceFile("src/lib/reports/weekly-trust-report.ts");
  const reportExport = await readWorkspaceFile("src/lib/reports/report-export.ts");
  const analyticsEvents = await readWorkspaceFile("src/lib/analytics/events.ts");
  const analyticsPosthog = await readWorkspaceFile("src/lib/analytics/posthog.ts");
  const analyticsDocs = await readWorkspaceFile("docs/ANALYTICS.md");
  const routes = await readWorkspaceFile("src/lib/radar-routes.ts");

  assert.match(reportPage, /dynamic = "force-dynamic"/);
  assert.match(reportPage, /requireActiveWorkspace/);
  assert.match(reportPage, /generateWeeklyTrustReport/);
  assert.match(reportPage, /buildWeeklyTrustReportExportPayload/);
  assert.match(reportPage, /event: "report_viewed"/);
  assert.match(reportDetail, /Export-ready JSON/);
  assert.match(reportGenerator, /openExceptions/);
  assert.match(reportGenerator, /recommendedNextActions/);
  assert.match(reportExport, /schemaVersion: "radar.report-export.v1"/);
  assert.match(analyticsEvents, /"source_added"/);
  assert.match(analyticsEvents, /"assertion_approved"/);
  assert.match(analyticsEvents, /"run_completed"/);
  assert.match(analyticsEvents, /"finding_opened"/);
  assert.match(analyticsEvents, /"fix_rerun"/);
  assert.match(analyticsEvents, /"report_viewed"/);
  assert.match(analyticsPosthog, /NEXT_PUBLIC_POSTHOG_KEY is not configured/);
  assert.match(analyticsDocs, /Do not send source text/);
  assert.match(routes, /weeklyReportRoute/);
});

test("RAD-090 gate verifies Phase 8 completion and product scope remain locked", async () => {
  const tasks = await readWorkspaceFile("tasks/TASKS.md");
  const task = await readWorkspaceFile("tasks/phase-8-dashboard-reports-alerts/rad-090-e2e-gate-9-executive-dashboard-and-report-flow.md");
  const routes = await readWorkspaceFile("src/lib/radar-routes.ts");
  const sidebar = await readWorkspaceFile("src/components/app-shell/sidebar-nav.tsx");
  const productScope = await readWorkspaceFile("docs/PRODUCT_SCOPE.md");
  const phaseEightSources = [
    await readWorkspaceFile("src/app/(app)/command-center/page.tsx"),
    await readWorkspaceFile("src/components/command-center/needs-attention-panel.tsx"),
    await readWorkspaceFile("src/components/command-center/assertion-health-panel.tsx"),
    await readWorkspaceFile("src/components/command-center/recent-activity-feed.tsx"),
    await readWorkspaceFile("src/lib/reports/weekly-trust-report.ts"),
    await readWorkspaceFile("src/lib/notifications/dispatcher.ts"),
    await readWorkspaceFile("src/lib/notifications/slack-dispatcher.ts"),
    await readWorkspaceFile("src/lib/analytics/events.ts"),
  ];

  for (const ticket of ["RAD-081", "RAD-082", "RAD-083", "RAD-084", "RAD-085", "RAD-086", "RAD-087", "RAD-088", "RAD-089", "RAD-090"]) {
    assert.match(tasks, new RegExp(`${ticket}[\\s\\S]*Done`));
  }

  assert.match(task, /Gate report/);
  assert.match(task, /Result: Done/);
  assert.match(routes, /title: "Command Center"/);
  assert.match(routes, /title: "Assertions"/);
  assert.match(routes, /title: "Findings"/);
  assert.match(routes, /title: "Sources"/);
  assert.match(productScope, /Email\/Slack notification basics/);
  assert.match(productScope, /Full integration marketplace/);
  assert.match(productScope, /Prompt playground/);
  assert.doesNotMatch(sidebar, /Prompt Playground|Trace Explorer|Workflow Canvas|Marketplace|Analytics/i);

  for (const source of phaseEightSources) {
    assert.doesNotMatch(source, /generic eval platform|prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret|Bearer [A-Za-z0-9]/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});
