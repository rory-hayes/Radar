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

test("RAD-038 adds a source detail route with loading state", async () => {
  await fileExists("src/app/(app)/sources/[sourceId]/page.tsx");
  await fileExists("src/app/(app)/sources/[sourceId]/loading.tsx");

  const page = await readWorkspaceFile("src/app/(app)/sources/[sourceId]/page.tsx");
  const loading = await readWorkspaceFile("src/app/(app)/sources/[sourceId]/loading.tsx");

  assert.match(page, /SourceDetailPage/);
  assert.match(page, /PageHeader/);
  assert.match(page, /TabsList/);
  assert.match(page, /TabsTrigger value="overview"/);
  assert.match(page, /TabsTrigger value="versions"/);
  assert.match(page, /TabsTrigger value="content"/);
  assert.match(page, /TabsTrigger value="assertions"/);
  assert.match(loading, /LoadingState/);
  assert.match(loading, /Loading source detail/);
});

test("RAD-038 source detail loads versions documents chunks and affected assertions", async () => {
  const page = await readWorkspaceFile("src/app/(app)/sources/[sourceId]/page.tsx");
  const sourceRepository = await readWorkspaceFile("src/lib/repositories/sources.ts");
  const assertionRepository = await readWorkspaceFile("src/lib/repositories/assertions.ts");

  assert.match(page, /getSourceById/);
  assert.match(page, /listSourceVersions/);
  assert.match(page, /listSourceDocuments/);
  assert.match(page, /listSourceChunksPreview/);
  assert.match(page, /listAssertionSourcesForSource/);
  assert.match(page, /SourceVersionTable/);
  assert.match(page, /SourceContentPreview/);
  assert.match(page, /LinkedAssertions/);
  assert.match(sourceRepository, /export async function listSourceVersions/);
  assert.match(sourceRepository, /export async function listSourceDocuments/);
  assert.match(sourceRepository, /export async function listSourceChunksPreview/);
  assert.match(assertionRepository, /export async function listAssertionSourcesForSource/);
});

test("RAD-038 exposes guarded manual resync and source detail navigation", async () => {
  const page = await readWorkspaceFile("src/app/(app)/sources/[sourceId]/page.tsx");
  const actions = await readWorkspaceFile("src/app/(app)/sources/actions.ts");
  const card = await readWorkspaceFile("src/components/sources/source-card.tsx");
  const list = await readWorkspaceFile("src/components/sources/source-list.tsx");

  assert.match(page, /resyncSourceAction/);
  assert.match(page, /name="sourceId"/);
  assert.match(page, /Sync now/);
  assert.match(actions, /resyncSourceAction/);
  assert.match(actions, /runSourceSyncJob/);
  assert.match(actions, /permission: "source:edit"/);
  assert.match(card, /href=\{`\/sources\/\$\{source\.id\}`\}/);
  assert.match(list, /href=\{`\/sources\/\$\{source\.id\}`\}/);
});

test("RAD-038 composes approved shadcn primitives without generic platform scope", async () => {
  const page = await readWorkspaceFile("src/app/(app)/sources/[sourceId]/page.tsx");
  const task = await readWorkspaceFile("tasks/phase-3-sources-evidence/rad-038-build-source-detail-page.md");

  assert.match(page, /Card/);
  assert.match(page, /Table/);
  assert.match(page, /Alert/);
  assert.match(page, /EvidenceSnippet/);
  assert.match(page, /StatusBadge/);
  assert.match(task, /shadcnio/);
  assert.match(task, /CLI docs fallback/);

  assert.doesNotMatch(page, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
  assert.doesNotMatch(page, /service_role|sb_secret/i);
  assert.doesNotMatch(page, /console\.log|console\.error/);
});
