import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function fileExists(relativePath) {
  await access(relativePath);
  return true;
}

test("RAD-008 defines Radar enterprise token families", async () => {
  const globals = await readFile("src/app/globals.css", "utf8");

  for (const token of [
    "--radar-surface-raised",
    "--radar-surface-subtle",
    "--radar-line-strong",
    "--radar-text-soft",
    "--radar-status-pass-bg",
    "--radar-status-warning-bg",
    "--radar-status-fail-bg",
    "--radar-status-running-bg",
    "--radar-status-neutral-bg",
    "--radar-severity-critical-bg",
    "--radar-severity-high-bg",
    "--radar-severity-medium-bg",
    "--radar-severity-low-bg",
    "--radar-card-radius",
    "--radar-control-height",
  ]) {
    assert.match(globals, new RegExp(token));
  }

  assert.doesNotMatch(globals, /gradient-orb|glassmorphism|bokeh/i);
});

test("RAD-008 exposes typed Radar-owned base components", async () => {
  const barrel = await readFile("src/components/radar/index.ts", "utf8");

  for (const exportName of [
    "MetricCard",
    "StatusBadge",
    "SeverityBadge",
    "EmptyState",
    "LoadingState",
    "ErrorState",
    "EvidenceDiff",
    "EvidenceSnippet",
  ]) {
    assert.match(barrel, new RegExp(exportName));
  }

  for (const component of [
    "metric-card",
    "status-badge",
    "severity-badge",
    "empty-state",
    "loading-state",
    "error-state",
    "evidence-diff",
    "evidence-snippet",
  ]) {
    await fileExists(`src/components/radar/${component}.tsx`);
  }
});

test("RAD-008 keeps status and severity variants semantic", async () => {
  const statusBadge = await readFile("src/components/radar/status-badge.tsx", "utf8");
  const severityBadge = await readFile("src/components/radar/severity-badge.tsx", "utf8");

  assert.match(statusBadge, /statusTones = \["pass", "warning", "fail", "running", "neutral"\]/);
  assert.match(severityBadge, /severityTones = \["critical", "high", "medium", "low", "info"\]/);
  assert.match(statusBadge, /var\(--radar-status-pass-bg\)/);
  assert.match(severityBadge, /var\(--radar-severity-critical-bg\)/);
  assert.doesNotMatch(statusBadge, /bg-(red|green|yellow|blue)-/);
  assert.doesNotMatch(severityBadge, /bg-(red|green|yellow|blue)-/);
});

test("RAD-008 wires app shell placeholders to Radar base states", async () => {
  const routePlaceholder = await readFile("src/components/app-shell/route-placeholder.tsx", "utf8");
  const loadingState = await readFile("src/app/(app)/loading.tsx", "utf8");
  const errorState = await readFile("src/app/(app)/error.tsx", "utf8");

  assert.match(routePlaceholder, /MetricCard/);
  assert.match(loadingState, /LoadingState/);
  assert.match(errorState, /ErrorState/);
});
