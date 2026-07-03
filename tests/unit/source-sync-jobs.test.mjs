import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-035 adds a server-only source sync job executor", async () => {
  const syncJobs = await readWorkspaceFile("src/lib/sources/source-sync-jobs.ts");

  assert.match(syncJobs, /server-only/);
  assert.match(syncJobs, /export async function runSourceSyncJob/);
  assert.match(syncJobs, /sourceSyncReasons = \["manual", "scheduled", "source_change", "initial"\]/);
  assert.match(syncJobs, /getSourceSyncTarget/);
  assert.match(syncJobs, /syncStatus: "syncing"/);
  assert.match(syncJobs, /syncStatus: "synced"/);
  assert.match(syncJobs, /syncStatus: "error"/);
  assert.match(syncJobs, /SourceSyncJobResult/);
});

test("RAD-035 detects unchanged source content before writing a new version", async () => {
  const syncJobs = await readWorkspaceFile("src/lib/sources/source-sync-jobs.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/sources.ts");

  assert.match(syncJobs, /getSourceVersionByContentHash/);
  assert.match(syncJobs, /status: "unchanged"/);
  assert.match(syncJobs, /markSourceUnchanged/);
  assert.match(syncJobs, /force = false/);
  assert.match(syncJobs, /previousContentHash: source\.contentHash/);
  assert.match(repository, /export async function getLatestSourceVersion/);
  assert.match(repository, /export async function getSourceVersionByContentHash/);
  assert.match(repository, /\.eq\("content_hash", contentHash\)/);
});

test("RAD-035 syncs URL and manual text sources through versioned documents and chunks", async () => {
  const syncJobs = await readWorkspaceFile("src/lib/sources/source-sync-jobs.ts");

  assert.match(syncJobs, /crawlUrlSource/);
  assert.match(syncJobs, /persistUrlCrawlResult/);
  assert.match(syncJobs, /syncManualTextSource/);
  assert.match(syncJobs, /hashText\(manualText\)/);
  assert.match(syncJobs, /createSourceVersion/);
  assert.match(syncJobs, /createSourceDocument/);
  assert.match(syncJobs, /createSourceChunk/);
  assert.match(syncJobs, /chunkSourceText/);
  assert.match(syncJobs, /manual_text_source_missing_content/);
});

test("RAD-035 exposes guarded manual sync without adding unrelated product scope", async () => {
  const route = await readWorkspaceFile("src/app/api/sources/sync/route.ts");
  const syncJobs = await readWorkspaceFile("src/lib/sources/source-sync-jobs.ts");
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");
  const sourcesEvidence = await readWorkspaceFile("docs/SOURCES_AND_EVIDENCE.md");

  assert.match(route, /runWorkspaceApiHandler/);
  assert.match(route, /permission: "source:edit"/);
  assert.match(route, /sourceSyncRequestSchema/);
  assert.match(route, /runSourceSyncJob/);
  assert.match(route, /successStatus: 202/);
  assert.match(dataModel, /RAD-035/);
  assert.match(sourcesEvidence, /RAD-035/);

  for (const source of [route, syncJobs]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});
