import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-058 adds latest state and pass-rate summaries to assertion run history", async () => {
  const detail = await readWorkspaceFile("src/components/assertions/assertion-detail.tsx");

  assert.match(detail, /Recent assertion evaluations, pass rate, and first visible failure marker/);
  assert.match(detail, /RunHistorySummaryItem/);
  assert.match(detail, /label="Latest state"/);
  assert.match(detail, /label="Latest pass rate"/);
  assert.match(detail, /formatPassRate/);
  assert.match(detail, /formatResultMix/);
});

test("RAD-058 marks the first visible failure in run history", async () => {
  const detail = await readWorkspaceFile("src/components/assertions/assertion-detail.tsx");

  assert.match(detail, /firstFailureInHistory/);
  assert.match(detail, /label="First failure in view"/);
  assert.match(detail, /First failure/);
  assert.match(detail, /run\.failedCount \+ run\.errorCount > 0/);
});

test("RAD-058 keeps run history on assertion detail with approved primitives", async () => {
  const detail = await readWorkspaceFile("src/components/assertions/assertion-detail.tsx");
  const task = await readWorkspaceFile("tasks/phase-5-eval-knowledge-runner/rad-058-build-eval-run-history-ui.md");

  assert.match(detail, /TabsTrigger value="runs"/);
  assert.match(detail, /Card/);
  assert.match(detail, /Table/);
  assert.match(detail, /Badge/);
  assert.match(detail, /StatusBadge/);
  assert.match(task, /No new shadcn block was installed/);

  for (const source of [detail]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});
