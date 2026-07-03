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

test("RAD-072 replaces the Findings placeholder with a real workspace inbox", async () => {
  await fileExists("src/app/(app)/findings/page.tsx");
  await fileExists("src/components/findings/finding-inbox.tsx");

  const page = await readWorkspaceFile("src/app/(app)/findings/page.tsx");
  const inbox = await readWorkspaceFile("src/components/findings/finding-inbox.tsx");

  assert.match(page, /requireActiveWorkspace/);
  assert.match(page, /createSupabaseServerClient/);
  assert.match(page, /listFindings/);
  assert.match(page, /listAssertions/);
  assert.match(page, /FindingInbox/);
  assert.doesNotMatch(page, /RoutePlaceholder/);
  assert.match(inbox, /Finding inbox/);
});

test("RAD-072 exposes searchable finding filters and pagination", async () => {
  const page = await readWorkspaceFile("src/app/(app)/findings/page.tsx");
  const inbox = await readWorkspaceFile("src/components/findings/finding-inbox.tsx");

  assert.match(page, /filtersFromSearchParams/);
  assert.match(page, /filterFindings/);
  assert.match(page, /pageFromSearchParams/);
  assert.match(page, /pageSize = 10/);
  assert.match(inbox, /name="q"/);
  assert.match(inbox, /name="severity"/);
  assert.match(inbox, /name="status"/);
  assert.match(inbox, /name="owner"/);
  assert.match(inbox, /name="assertion"/);
  assert.match(inbox, /PaginationControls/);
  assert.match(inbox, /findingPageHref/);
});

test("RAD-072 renders severity confidence owner status assertion and impact columns", async () => {
  const inbox = await readWorkspaceFile("src/components/findings/finding-inbox.tsx");

  for (const label of [
    "Finding",
    "Severity",
    "Status",
    "Owner",
    "Affected assertion",
    "Confidence",
    "Customer impact",
  ]) {
    assert.match(inbox, new RegExp(label));
  }

  assert.match(inbox, /SeverityBadge/);
  assert.match(inbox, /StatusBadge/);
  assert.match(inbox, /formatConfidence/);
  assert.match(inbox, /formatOwner/);
  assert.ok(inbox.includes("href={`/assertions/${finding.assertionId}`}"));
});

test("RAD-072 uses approved shadcn primitives without installing broad blocks", async () => {
  const inbox = await readWorkspaceFile("src/components/findings/finding-inbox.tsx");
  const task = await readWorkspaceFile("tasks/phase-7-findings-fixes/rad-072-build-findings-inbox-page.md");

  assert.match(inbox, /@\/components\/ui\/card/);
  assert.match(inbox, /@\/components\/ui\/field/);
  assert.match(inbox, /@\/components\/ui\/input/);
  assert.match(inbox, /@\/components\/ui\/select/);
  assert.match(inbox, /@\/components\/ui\/table/);
  assert.match(inbox, /FieldGroup/);
  assert.match(inbox, /SelectGroup/);
  assert.match(inbox, /TableHeader/);
  assert.match(task, /shadcn\.io MCP connected/);
});

test("RAD-072 adds metrics loading and error states while preserving Radar scope", async () => {
  await fileExists("src/app/(app)/findings/loading.tsx");

  const page = await readWorkspaceFile("src/app/(app)/findings/page.tsx");
  const loading = await readWorkspaceFile("src/app/(app)/findings/loading.tsx");
  const inbox = await readWorkspaceFile("src/components/findings/finding-inbox.tsx");

  assert.match(page, /FindingMetrics/);
  assert.match(page, /ErrorState/);
  assert.match(page, /Findings could not load/);
  assert.match(page, /Open/);
  assert.match(page, /Critical/);
  assert.match(page, /Unassigned/);
  assert.match(loading, /Loading findings/);

  for (const source of [page, inbox]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
    assert.doesNotMatch(source, /demo finding|mock finding|lorem ipsum/i);
  }
});
