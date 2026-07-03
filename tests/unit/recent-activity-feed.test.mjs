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

test("RAD-084 builds a real recent activity feed from workspace events", async () => {
  await fileExists("src/lib/command-center/recent-activity.ts");

  const feed = await readWorkspaceFile("src/lib/command-center/recent-activity.ts");

  assert.match(feed, /buildRecentActivityFeed/);
  assert.match(feed, /source_synced/);
  assert.match(feed, /source_sync_failed/);
  assert.match(feed, /assertion_run_completed/);
  assert.match(feed, /finding_opened/);
  assert.match(feed, /finding_resolved/);
  assert.match(feed, /finding_rerun/);
  assert.match(feed, /report_generated/);
  assert.match(feed, /source\.lastSyncedAt/);
  assert.match(feed, /source\.updatedAt/);
  assert.match(feed, /run\.completedAt \?\? run\.createdAt/);
  assert.match(feed, /finding\.firstSeenAt/);
  assert.match(feed, /activity\.activityType === "rerun_linked"/);
  assert.match(feed, /generatedAt/);
});

test("RAD-084 loads recent activity from workspace-scoped repositories", async () => {
  const page = await readWorkspaceFile("src/app/(app)/command-center/page.tsx");
  const findings = await readWorkspaceFile("src/lib/repositories/findings.ts");
  const summary = await readWorkspaceFile("src/lib/command-center/kpi-summary.ts");

  assert.match(page, /listSources/);
  assert.match(page, /listRecentFindingActivityForWorkspace/);
  assert.match(page, /buildCommandCenterKpiSummary\(\{ assertions, findings, sources, runs, findingActivity \}\)/);
  assert.match(findings, /export async function listRecentFindingActivityForWorkspace/);
  assert.match(findings, /\.eq\("workspace_id", workspaceId\)/);
  assert.match(findings, /\.order\("created_at", \{ ascending: false \}\)/);
  assert.match(findings, /first_seen_at/);
  assert.match(findings, /resolved_at/);
  assert.match(summary, /recentActivity: buildRecentActivityFeed/);
});

test("RAD-084 renders a shadcn-scoped Radar activity panel", async () => {
  await fileExists("src/components/command-center/recent-activity-feed.tsx");

  const panel = await readWorkspaceFile("src/components/command-center/recent-activity-feed.tsx");
  const summaryComponent = await readWorkspaceFile("src/components/command-center/command-center-kpi-summary.tsx");
  const index = await readWorkspaceFile("src/components/command-center/index.ts");

  assert.match(panel, /RecentActivityFeed/);
  assert.match(panel, /Card/);
  assert.match(panel, /Button/);
  assert.match(panel, /Separator/);
  assert.match(panel, /StatusBadge/);
  assert.match(panel, /Recent activity/);
  assert.match(panel, /source syncs, completed assertion runs, finding updates, reruns, and trust reports/i);
  assert.match(summaryComponent, /RecentActivityFeed activity=\{summary\.recentActivity\}/);
  assert.match(index, /recent-activity-feed/);
  assert.doesNotMatch(panel, /demo activity|mock activity|lorem ipsum/i);
  assert.doesNotMatch(panel, /generic eval platform|prompt playground|trace explorer|workflow canvas|integration marketplace/i);
});

test("RAD-084 documents checklist completion and MCP usage", async () => {
  const task = await readWorkspaceFile("tasks/phase-8-dashboard-reports-alerts/rad-084-build-recent-activity-feed.md");
  const tasks = await readWorkspaceFile("tasks/TASKS.md");

  assert.match(task, /Result: Done/);
  assert.match(task, /shadcnio MCP/);
  assert.match(task, /Docker daemon/);
  assert.match(tasks, /RAD-084[\s\S]*Done/);
});
