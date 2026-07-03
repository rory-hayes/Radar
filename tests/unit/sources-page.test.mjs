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

test("RAD-031 wires the Sources page to workspace-scoped repository data", async () => {
  const page = await readWorkspaceFile("src/app/(app)/sources/page.tsx");

  assert.match(page, /requireActiveWorkspace\(\)/);
  assert.match(page, /createSupabaseServerClient\(\)/);
  assert.match(page, /loadSourceListItems\(supabase, membership\.workspace\.id\)/);
  assert.match(page, /listSources\(supabase, workspaceId\)/);
  assert.match(page, /listSourceAssertionCounts\(supabase, workspaceId\)/);
  assert.match(page, /SourceCard/);
  assert.match(page, /SourceList/);
  assert.match(page, /MetricCard/);
  assert.match(page, /EmptyState/);
  assert.match(page, /ErrorState/);
  assert.match(page, /URL, uploaded document, manual policy text, API endpoint, or support bot endpoint/);
  assert.doesNotMatch(page, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
});

test("RAD-031 renders source cards and source inventory rows for every supported source type", async () => {
  const sourceCard = await readWorkspaceFile("src/components/sources/source-card.tsx");
  const sourceList = await readWorkspaceFile("src/components/sources/source-list.tsx");
  const sourceBarrel = await readWorkspaceFile("src/components/sources/index.ts");

  for (const expected of [
    "URL",
    "Uploaded document",
    "Manual text",
    "API endpoint",
    "Support bot endpoint",
  ]) {
    assert.match(sourceCard, new RegExp(expected));
  }

  for (const expected of ["Draft", "Ready", "Syncing", "Synced", "Needs attention", "Paused", "Archived"]) {
    assert.match(sourceCard, new RegExp(expected));
  }

  assert.match(sourceCard, /affectedAssertionCount/);
  assert.match(sourceCard, /StatusBadge/);
  assert.match(sourceCard, /formatSourceTimestamp/);
  assert.match(sourceList, /Table/);
  assert.match(sourceList, /TableHeader/);
  assert.match(sourceList, /TableBody/);
  assert.match(sourceList, /StatusBadge/);
  assert.match(sourceList, /Affected assertions/);
  assert.match(sourceBarrel, /SourceCard/);
  assert.match(sourceBarrel, /SourceList/);
  assert.doesNotMatch(sourceCard, /marketplace|prompt playground|trace explorer|workflow canvas/i);
  assert.doesNotMatch(sourceList, /marketplace|prompt playground|trace explorer|workflow canvas/i);
});

test("RAD-031 adds scoped loading and error states for the Sources route", async () => {
  for (const path of ["src/app/(app)/sources/loading.tsx", "src/app/(app)/sources/error.tsx"]) {
    await fileExists(path);
  }

  const loading = await readWorkspaceFile("src/app/(app)/sources/loading.tsx");
  const error = await readWorkspaceFile("src/app/(app)/sources/error.tsx");

  assert.match(loading, /LoadingState/);
  assert.match(loading, /variant="list"/);
  assert.match(error, /"use client"/);
  assert.match(error, /ErrorState/);
  assert.match(error, /reset/);
  assert.match(error, /Button/);
});

test("RAD-031 keeps affected assertion counts in the repository layer", async () => {
  const repository = await readWorkspaceFile("src/lib/repositories/sources.ts");

  assert.match(repository, /listSourceAssertionCounts/);
  assert.match(repository, /\.from\("assertion_sources"\)/);
  assert.match(repository, /\.select\("source_id"\)/);
  assert.match(repository, /\.eq\("workspace_id", workspaceId\)/);
  assert.match(repository, /assertRepositorySuccess\(error, "Unable to list source assertion counts"\)/);
  assert.match(repository, /counts\[row\.source_id\]/);
});
