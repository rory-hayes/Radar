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

test("RAD-073 adds a selected finding detail panel", async () => {
  await fileExists("src/components/findings/finding-detail-panel.tsx");

  const panel = await readWorkspaceFile("src/components/findings/finding-detail-panel.tsx");
  const index = await readWorkspaceFile("src/components/findings/index.ts");

  assert.match(panel, /FindingDetailPanel/);
  assert.match(panel, /Expected vs actual/);
  assert.match(panel, /Customer impact/);
  assert.match(panel, /Recommended fix/);
  assert.match(panel, /Open assertion/);
  assert.match(panel, /Review run history/);
  assert.match(index, /finding-detail-panel/);
});

test("RAD-073 wires selected finding detail into the Findings page", async () => {
  const page = await readWorkspaceFile("src/app/(app)/findings/page.tsx");
  const inbox = await readWorkspaceFile("src/components/findings/finding-inbox.tsx");

  assert.match(page, /FindingDetailPanel/);
  assert.match(page, /selectedFindingFromList/);
  assert.match(page, /resolvedSearchParams\.finding/);
  assert.match(page, /loadFindingDetail/);
  assert.match(page, /listFindingEvidence/);
  assert.match(page, /listFindingActivity/);
  assert.match(page, /xl:grid-cols-\[minmax\(0,1fr\)_26rem\]/);
  assert.match(inbox, /selectedFindingId/);
  assert.match(inbox, /findingSelectionHref/);
  assert.match(inbox, /params\.set\("finding", findingId\)/);
});

test("RAD-073 renders evidence activity owner status and run context", async () => {
  const panel = await readWorkspaceFile("src/components/findings/finding-detail-panel.tsx");

  assert.match(panel, /FindingEvidenceList/);
  assert.match(panel, /EvidenceSnippet/);
  assert.match(panel, /artifactPath/);
  assert.match(panel, /FindingActivityList/);
  assert.match(panel, /formatActivityType/);
  assert.match(panel, /activityStatusChange/);
  assert.match(panel, /SeverityBadge/);
  assert.match(panel, /StatusBadge/);
  assert.match(panel, /formatOwner/);
  assert.match(panel, /formatConfidence/);
});

test("RAD-073 adds repository support for detail activity and artifact evidence", async () => {
  const repository = await readWorkspaceFile("src/lib/repositories/findings.ts");
  const schema = await readWorkspaceFile("src/lib/findings/schema.ts");
  const validation = await readWorkspaceFile("src/lib/validation/schemas.ts");

  assert.match(repository, /listFindingActivity/);
  assert.match(repository, /\.from\("finding_activity"\)[\s\S]*?\.eq\("workspace_id", workspaceId\)[\s\S]*?\.eq\("finding_id", findingId\)/);
  assert.match(repository, /artifact_path/);
  assert.match(repository, /artifactPath: optionalString\(row\.artifact_path\)/);
  assert.match(schema, /artifactPath\?: string/);
  assert.match(validation, /artifactPath: z\.string\(\)\.optional\(\)/);
});

test("RAD-073 keeps the detail panel shadcn-scoped and product-specific", async () => {
  const panel = await readWorkspaceFile("src/components/findings/finding-detail-panel.tsx");
  const task = await readWorkspaceFile("tasks/phase-7-findings-fixes/rad-073-build-finding-detail-panel.md");

  assert.match(panel, /@\/components\/ui\/card/);
  assert.match(panel, /@\/components\/ui\/button/);
  assert.match(panel, /@\/components\/ui\/separator/);
  assert.match(task, /shadcn\.io MCP connected/);
  assert.doesNotMatch(panel, /prompt playground|trace explorer|workflow canvas|integration marketplace|model comparison/i);
  assert.doesNotMatch(panel, /demo finding|mock finding|lorem ipsum/i);
});
