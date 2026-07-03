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

test("RAD-089 defines a bounded product analytics event taxonomy", async () => {
  await fileExists("src/lib/analytics/events.ts");

  const events = await readWorkspaceFile("src/lib/analytics/events.ts");
  const docs = await readWorkspaceFile("docs/ANALYTICS.md");

  assert.match(events, /productAnalyticsEvents = \[/);
  assert.match(events, /"source_added"/);
  assert.match(events, /"assertion_approved"/);
  assert.match(events, /"run_completed"/);
  assert.match(events, /"finding_opened"/);
  assert.match(events, /"fix_rerun"/);
  assert.match(events, /"report_viewed"/);
  assert.match(events, /sourceAddedPropertiesSchema/);
  assert.match(events, /runCompletedPropertiesSchema/);
  assert.match(events, /reportViewedPropertiesSchema/);
  assert.match(docs, /Do not send source text/);
  assert.match(docs, /webhook URLs/);
  assert.doesNotMatch(events, /sourceContent|promptText|actualOutput|expectedBehavior|originUri/);
});

test("RAD-089 captures PostHog events safely when configured", async () => {
  const posthog = await readWorkspaceFile("src/lib/analytics/posthog.ts");

  assert.match(posthog, /trackProductEvent/);
  assert.match(posthog, /NEXT_PUBLIC_POSTHOG_KEY is not configured/);
  assert.match(posthog, /https:\/\/app\.posthog\.com/);
  assert.match(posthog, /safeParse/);
  assert.match(posthog, /distinct_id/);
  assert.match(posthog, /camelToSnakeCase/);
  assert.match(posthog, /boundedResponseText/);
  assert.doesNotMatch(posthog, /throw new Error/);
});

test("RAD-089 instruments the required product workflows", async () => {
  const sourceActions = await readWorkspaceFile("src/app/(app)/sources/actions.ts");
  const assertionActions = await readWorkspaceFile("src/app/(app)/assertions/actions.ts");
  const jobOrchestration = await readWorkspaceFile("src/lib/evaluation/job-orchestration.ts");
  const findingsPage = await readWorkspaceFile("src/app/(app)/findings/page.tsx");
  const findingActions = await readWorkspaceFile("src/app/(app)/findings/actions.ts");
  const reportPage = await readWorkspaceFile("src/app/(app)/reports/weekly/page.tsx");

  assert.match(sourceActions, /event: "source_added"/);
  assert.match(sourceActions, /sourceType: source\.type/);
  assert.match(assertionActions, /event: "assertion_approved"/);
  assert.match(assertionActions, /trackAssertionApprovedIfActive/);
  assert.match(jobOrchestration, /event: "run_completed"/);
  assert.match(jobOrchestration, /passedCount: completedRun\.passedCount/);
  assert.match(findingsPage, /event: "finding_opened"/);
  assert.match(findingsPage, /selectedFinding && selectedFindingId/);
  assert.match(findingActions, /event: "fix_rerun"/);
  assert.match(findingActions, /targetedTestCase: Boolean\(requestedTestCase\)/);
  assert.match(reportPage, /event: "report_viewed"/);
  assert.match(reportPage, /activeExceptions: result\.report\.activeExceptions/);
});

test("RAD-089 documents completion and validation", async () => {
  const task = await readWorkspaceFile("tasks/phase-8-dashboard-reports-alerts/rad-089-add-product-analytics-and-event-taxonomy.md");
  const tasks = await readWorkspaceFile("tasks/TASKS.md");

  assert.match(task, /Result: Done/);
  assert.match(task, /PostHog/);
  assert.match(task, /Docker daemon/);
  assert.match(tasks, /RAD-089[\s\S]*Done/);
});
