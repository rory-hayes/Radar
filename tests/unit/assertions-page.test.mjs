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

test("RAD-041 replaces the assertions placeholder with a real workspace-backed page", async () => {
  await fileExists("src/app/(app)/assertions/loading.tsx");
  await fileExists("src/components/assertions/assertion-table.tsx");

  const page = await readWorkspaceFile("src/app/(app)/assertions/page.tsx");
  const loading = await readWorkspaceFile("src/app/(app)/assertions/loading.tsx");

  assert.match(page, /requireActiveWorkspace/);
  assert.match(page, /createSupabaseServerClient/);
  assert.match(page, /listAssertions/);
  assert.match(page, /listAssertionSourceCounts/);
  assert.match(page, /listAssertionRunSchedules/);
  assert.match(page, /listLatestEvaluationRunsForAssertions/);
  assert.match(page, /AssertionTable/);
  assert.match(page, /ErrorState/);
  assert.doesNotMatch(page, /RoutePlaceholder/);
  assert.match(loading, /LoadingState/);
  assert.match(loading, /Loading assertions/);
});

test("RAD-041 supports search filters and pagination from server search params", async () => {
  const page = await readWorkspaceFile("src/app/(app)/assertions/page.tsx");
  const table = await readWorkspaceFile("src/components/assertions/assertion-table.tsx");

  assert.match(page, /filtersFromSearchParams/);
  assert.match(page, /pageFromSearchParams/);
  assert.match(page, /filterAssertions/);
  assert.match(page, /pageSize = 10/);
  assert.match(table, /name="q"/);
  assert.match(table, /name="status"/);
  assert.match(table, /name="category"/);
  assert.match(table, /name="priority"/);
  assert.match(table, /name="runnerType"/);
  assert.match(table, /name="owner"/);
  assert.match(table, /PaginationControls/);
  assert.match(table, /assertionPageHref/);
});

test("RAD-041 renders the required assertion table columns and empty state", async () => {
  const table = await readWorkspaceFile("src/components/assertions/assertion-table.tsx");

  for (const label of [
    "Assertion",
    "Category",
    "Status",
    "Runner",
    "Priority",
    "Owner",
    "Schedule",
    "Pass rate",
    "Last run",
    "Sources",
  ]) {
    assert.match(table, new RegExp(label));
  }

  assert.match(table, /No assertions are being verified yet/);
  assert.match(table, /No assertions match these filters/);
  assert.match(table, /formatPassRate/);
  assert.match(table, /formatLastRun/);
  assert.match(table, /formatSchedule/);
});

test("RAD-041 composes approved shadcn primitives without product scope drift", async () => {
  const table = await readWorkspaceFile("src/components/assertions/assertion-table.tsx");
  const task = await readWorkspaceFile("tasks/phase-4-assertions-testcases/rad-041-build-assertions-page-table-and-filters.md");

  assert.match(table, /Card/);
  assert.match(table, /Table/);
  assert.match(table, /Input/);
  assert.match(table, /Select/);
  assert.match(table, /SelectGroup/);
  assert.match(table, /Badge|StatusBadge|SeverityBadge/);
  assert.match(task, /shadcn/);

  assert.doesNotMatch(table, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
  assert.doesNotMatch(table, /service_role|sb_secret/i);
  assert.doesNotMatch(table, /console\.log|console\.error/);
});
