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

test("RAD-087 creates workspace-scoped notification delivery persistence", async () => {
  await fileExists("supabase/migrations/20260703122000_create_notification_deliveries.sql");

  const migration = await readWorkspaceFile("supabase/migrations/20260703122000_create_notification_deliveries.sql");
  const repository = await readWorkspaceFile("src/lib/repositories/notifications.ts");
  const index = await readWorkspaceFile("src/lib/repositories/index.ts");

  assert.match(migration, /create type public\.notification_delivery_type/);
  assert.match(migration, /'critical_finding'/);
  assert.match(migration, /'weekly_report_available'/);
  assert.match(migration, /'source_sync_failed'/);
  assert.match(migration, /'workspace_invite'/);
  assert.match(migration, /create table public\.notification_deliveries/);
  assert.match(migration, /workspace_id uuid not null/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /current_user_is_workspace_member/);
  assert.match(migration, /current_user_can_edit_workspace/);
  assert.match(repository, /createNotificationDelivery/);
  assert.match(repository, /updateNotificationDeliveryStatus/);
  assert.match(repository, /listNotificationDeliveries/);
  assert.match(index, /repositories\/notifications/);
});

test("RAD-087 builds safe email templates for all required notification types", async () => {
  const schema = await readWorkspaceFile("src/lib/notifications/schema.ts");
  const templates = await readWorkspaceFile("src/lib/notifications/email-templates.ts");

  assert.match(schema, /notificationDeliveryTypes = \[/);
  assert.match(schema, /critical_finding/);
  assert.match(schema, /weekly_report_available/);
  assert.match(schema, /source_sync_failed/);
  assert.match(schema, /workspace_invite/);
  assert.match(schema, /notificationEmailRequestSchema/);
  assert.match(templates, /buildRadarEmailTemplate/);
  assert.match(templates, /Critical finding needs attention/);
  assert.match(templates, /Weekly trust report ready/);
  assert.match(templates, /Source sync failed/);
  assert.match(templates, /Workspace invitation/);
  assert.match(templates, /Manage notification preferences/);
  assert.match(templates, /Unsubscribe or adjust email notifications/);
  assert.match(templates, /escapeHtml/);
});

test("RAD-087 sends through Resend with safe skipped states and delivery updates", async () => {
  const resend = await readWorkspaceFile("src/lib/notifications/resend.ts");
  const dispatcher = await readWorkspaceFile("src/lib/notifications/dispatcher.ts");
  const envSchema = await readWorkspaceFile("src/lib/env/schema.ts");
  const envScript = await readWorkspaceFile("scripts/validate-env.mjs");

  assert.match(resend, /https:\/\/api\.resend\.com\/emails/);
  assert.match(resend, /Authorization: `Bearer \$\{apiKey\}`/);
  assert.match(resend, /RESEND_API_KEY is not configured/);
  assert.match(resend, /RESEND_FROM_EMAIL is not configured/);
  assert.match(resend, /boundedResponseText/);
  assert.match(dispatcher, /sendWorkspaceNotificationEmails/);
  assert.match(dispatcher, /createNotificationDelivery/);
  assert.match(dispatcher, /sendResendEmail/);
  assert.match(dispatcher, /updateNotificationDeliveryStatus/);
  assert.match(dispatcher, /notificationPreferencesUrl/);
  assert.match(dispatcher, /status: "skipped"/);
  assert.match(envSchema, /RESEND_FROM_EMAIL/);
  assert.match(envSchema, /RADAR_APP_URL/);
  assert.match(envScript, /RESEND_FROM_EMAIL/);
  assert.match(envScript, /RADAR_APP_URL/);
});

test("RAD-087 exposes a guarded workspace email notification API", async () => {
  await fileExists("src/app/api/notifications/email/route.ts");

  const route = await readWorkspaceFile("src/app/api/notifications/email/route.ts");

  assert.match(route, /runWorkspaceApiHandler/);
  assert.match(route, /permission: "workspace:manage"/);
  assert.match(route, /notificationEmailRequestSchema/);
  assert.match(route, /sendWorkspaceNotificationEmails/);
  assert.match(route, /workspaceId: membership\.workspace\.id/);
  assert.match(route, /workspaceName: membership\.workspace\.name/);
});

test("RAD-087 documents completion and validation", async () => {
  const task = await readWorkspaceFile("tasks/phase-8-dashboard-reports-alerts/rad-087-implement-email-notifications-with-resend.md");
  const tasks = await readWorkspaceFile("tasks/TASKS.md");

  assert.match(task, /Result: Done/);
  assert.match(task, /Resend/);
  assert.match(task, /Docker daemon/);
  assert.match(tasks, /RAD-087[\s\S]*Done/);
});
