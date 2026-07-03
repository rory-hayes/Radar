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

test("RAD-082 selects the highest-priority active findings for Command Center", async () => {
  const summary = await readWorkspaceFile("src/lib/command-center/kpi-summary.ts");

  assert.match(summary, /selectNeedsAttentionFindings/);
  assert.match(summary, /activeFindingStatuses = \["open", "investigating", "fixed"\]/);
  assert.match(summary, /severityRank\(a\.severity\) - severityRank\(b\.severity\)/);
  assert.match(summary, /statusRank\(a\.status\) - statusRank\(b\.status\)/);
  assert.match(summary, /b\.confidence - a\.confidence/);
  assert.match(summary, /\.slice\(0, limit\)/);
  assert.match(summary, /assertionTitle: assertionTitles\.get\(finding\.assertionId\)/);
});

test("RAD-082 renders Needs Attention with severity confidence impact assertion and fix", async () => {
  await fileExists("src/components/command-center/needs-attention-panel.tsx");

  const panel = await readWorkspaceFile("src/components/command-center/needs-attention-panel.tsx");
  const summaryComponent = await readWorkspaceFile("src/components/command-center/command-center-kpi-summary.tsx");
  const index = await readWorkspaceFile("src/components/command-center/index.ts");

  assert.match(panel, /NeedsAttentionPanel/);
  assert.match(panel, /Needs attention/);
  assert.match(panel, /SeverityBadge/);
  assert.match(panel, /StatusBadge/);
  assert.match(panel, /confidence/);
  assert.match(panel, /customerImpact/);
  assert.match(panel, /Affected assertion/);
  assert.match(panel, /Primary fix/);
  assert.match(panel, /recommendedFix/);
  assert.match(panel, /Review finding/);
  assert.match(panel, /Open assertion/);
  assert.match(panel, /Nothing needs attention/);
  assert.match(summaryComponent, /NeedsAttentionPanel findings=\{summary\.needsAttention\}/);
  assert.match(index, /needs-attention-panel/);
});

test("RAD-082 keeps the Needs Attention panel shadcn-scoped and Radar-specific", async () => {
  const panel = await readWorkspaceFile("src/components/command-center/needs-attention-panel.tsx");
  const task = await readWorkspaceFile("tasks/phase-8-dashboard-reports-alerts/rad-082-build-needs-attention-panel.md");
  const tasks = await readWorkspaceFile("tasks/TASKS.md");

  assert.match(panel, /Card/);
  assert.match(panel, /Button/);
  assert.match(panel, /Separator/);
  assert.match(panel, /Progress/);
  assert.doesNotMatch(panel, /demo finding|mock finding|lorem ipsum/i);
  assert.doesNotMatch(panel, /generic eval platform|prompt playground|trace explorer|workflow canvas|integration marketplace/i);
  assert.match(task, /Result: Done/);
  assert.match(task, /shadcnio MCP/);
  assert.match(tasks, /RAD-082[\s\S]*Done/);
});
