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

test("RAD-083 builds assertion health summaries for every V1 category", async () => {
  const summary = await readWorkspaceFile("src/lib/command-center/kpi-summary.ts");

  assert.match(summary, /buildAssertionCategoryHealth/);
  assert.match(summary, /assertionCategories\.map/);
  assert.match(summary, /pricing: "Pricing"/);
  assert.match(summary, /refund_cancellation: "Refund \/ cancellation"/);
  assert.match(summary, /trial_onboarding: "Trial onboarding"/);
  assert.match(summary, /billing_invoices: "Billing \/ invoices"/);
  assert.match(summary, /support_escalation: "Support escalation"/);
  assert.match(summary, /custom: "Custom"/);
  assert.match(summary, /activeAssertions/);
  assert.match(summary, /activeFindings/);
  assert.match(summary, /criticalFindings/);
  assert.match(summary, /passRate/);
  assert.match(summary, /categoryHealth: buildAssertionCategoryHealth/);
});

test("RAD-083 renders category health on the Command Center", async () => {
  await fileExists("src/components/command-center/assertion-health-panel.tsx");

  const panel = await readWorkspaceFile("src/components/command-center/assertion-health-panel.tsx");
  const summaryComponent = await readWorkspaceFile("src/components/command-center/command-center-kpi-summary.tsx");
  const index = await readWorkspaceFile("src/components/command-center/index.ts");

  assert.match(panel, /AssertionHealthPanel/);
  assert.match(panel, /Assertion health by category/);
  assert.match(panel, /Progress/);
  assert.match(panel, /StatusBadge/);
  assert.match(panel, /Findings/);
  assert.match(panel, /Critical/);
  assert.match(panel, /No assertion health yet/);
  assert.match(summaryComponent, /AssertionHealthPanel categories=\{summary\.categoryHealth\}/);
  assert.match(index, /assertion-health-panel/);
});

test("RAD-083 keeps category health scoped to Radar's dashboard model", async () => {
  const panel = await readWorkspaceFile("src/components/command-center/assertion-health-panel.tsx");
  const task = await readWorkspaceFile("tasks/phase-8-dashboard-reports-alerts/rad-083-build-assertion-health-by-category.md");
  const tasks = await readWorkspaceFile("tasks/TASKS.md");

  assert.match(panel, /Card/);
  assert.match(panel, /Separator/);
  assert.doesNotMatch(panel, /demo chart|mock analytics|lorem ipsum/i);
  assert.doesNotMatch(panel, /generic eval platform|prompt playground|trace explorer|workflow canvas|integration marketplace/i);
  assert.match(task, /Result: Done/);
  assert.match(task, /shadcnio MCP/);
  assert.match(tasks, /RAD-083[\s\S]*Done/);
});
