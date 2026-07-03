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

test("RAD-088 extends notification deliveries for Slack webhook alerts", async () => {
  await fileExists("supabase/migrations/20260703124000_extend_notification_deliveries_for_slack.sql");

  const migration = await readWorkspaceFile("supabase/migrations/20260703124000_extend_notification_deliveries_for_slack.sql");
  const schema = await readWorkspaceFile("src/lib/notifications/schema.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/notifications.ts");

  assert.match(migration, /add value if not exists 'daily_summary'/);
  assert.match(migration, /channel in \('email', 'slack'\)/);
  assert.match(migration, /recipient_label text/);
  assert.match(migration, /channel = 'slack' and recipient_label is not null/);
  assert.match(schema, /slackAlertTypes = \["critical_finding", "daily_summary"\]/);
  assert.match(schema, /slackAlertRequestSchema/);
  assert.match(schema, /notificationChannels = \["email", "slack"\]/);
  assert.match(repository, /recipient_label/);
  assert.match(repository, /provider: "resend" \| "slack_webhook"/);
});

test("RAD-088 builds critical finding and daily summary Slack templates", async () => {
  const templates = await readWorkspaceFile("src/lib/notifications/slack-templates.ts");

  assert.match(templates, /buildSlackAlertTemplate/);
  assert.match(templates, /Critical finding needs attention/);
  assert.match(templates, /Daily Radar summary/);
  assert.match(templates, /passRate/);
  assert.match(templates, /criticalFindingCount/);
  assert.match(templates, /escapeSlackText/);
  assert.doesNotMatch(templates, /oauth|marketplace/i);
});

test("RAD-088 sends Slack alerts through a server-only incoming webhook", async () => {
  const slack = await readWorkspaceFile("src/lib/notifications/slack.ts");
  const dispatcher = await readWorkspaceFile("src/lib/notifications/slack-dispatcher.ts");
  const envSchema = await readWorkspaceFile("src/lib/env/schema.ts");
  const envScript = await readWorkspaceFile("scripts/validate-env.mjs");

  assert.match(slack, /sendSlackWebhookAlert/);
  assert.match(slack, /SLACK_WEBHOOK_URL is not configured/);
  assert.match(slack, /must be an HTTPS URL/);
  assert.match(slack, /boundedResponseText/);
  assert.match(dispatcher, /sendWorkspaceSlackAlert/);
  assert.match(dispatcher, /createNotificationDelivery/);
  assert.match(dispatcher, /channel: "slack"/);
  assert.match(dispatcher, /provider: "slack_webhook"/);
  assert.match(dispatcher, /updateNotificationDeliveryStatus/);
  assert.match(envSchema, /SLACK_WEBHOOK_URL/);
  assert.match(envScript, /SLACK_WEBHOOK_URL/);
});

test("RAD-088 exposes a guarded workspace Slack notification API", async () => {
  await fileExists("src/app/api/notifications/slack/route.ts");

  const route = await readWorkspaceFile("src/app/api/notifications/slack/route.ts");

  assert.match(route, /runWorkspaceApiHandler/);
  assert.match(route, /permission: "workspace:manage"/);
  assert.match(route, /slackAlertRequestSchema/);
  assert.match(route, /sendWorkspaceSlackAlert/);
  assert.match(route, /workspaceId: membership\.workspace\.id/);
  assert.match(route, /workspaceName: membership\.workspace\.name/);
});

test("RAD-088 documents completion and validation", async () => {
  const task = await readWorkspaceFile("tasks/phase-8-dashboard-reports-alerts/rad-088-implement-slack-webhook-alerts.md");
  const tasks = await readWorkspaceFile("tasks/TASKS.md");

  assert.match(task, /Result: Done/);
  assert.match(task, /Slack/);
  assert.match(task, /Docker daemon/);
  assert.match(tasks, /RAD-088[\s\S]*Done/);
});
