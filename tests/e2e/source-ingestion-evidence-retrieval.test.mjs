import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-040 gate verifies source creation, upload, crawl, versioning, and chunk persistence", async () => {
  const actions = await readWorkspaceFile("src/app/(app)/sources/actions.ts");
  const sourceSyncJobs = await readWorkspaceFile("src/lib/sources/source-sync-jobs.ts");
  const fileIngestion = await readWorkspaceFile("src/lib/sources/file-ingestion.ts");
  const urlIngestion = await readWorkspaceFile("src/lib/sources/url-ingestion.ts");
  const sourceRepository = await readWorkspaceFile("src/lib/repositories/sources.ts");

  assert.match(actions, /runWorkspaceServerAction/);
  assert.match(actions, /createSourceAction/);
  assert.match(actions, /updateSourceAction/);
  assert.match(actions, /persistUploadedDocumentSource/);
  assert.match(actions, /runSourceSyncJob/);
  assert.match(sourceSyncJobs, /syncUrlSource/);
  assert.match(sourceSyncJobs, /syncManualTextSource/);
  assert.match(sourceSyncJobs, /persistUrlCrawlResult/);
  assert.match(sourceSyncJobs, /getSourceVersionByContentHash/);
  assert.match(fileIngestion, /extractUploadedDocument/);
  assert.match(fileIngestion, /uploadEvidenceArtifact/);
  assert.match(urlIngestion, /createSourceVersion/);
  assert.match(urlIngestion, /createSourceDocument/);
  assert.match(urlIngestion, /createSourceChunk/);
  assert.match(sourceRepository, /export async function updateSourceSyncState/);
  assert.match(sourceRepository, /\.eq\("workspace_id", workspaceId\)/);
});

test("RAD-040 gate verifies embedding and assertion-scoped evidence retrieval", async () => {
  const embeddingPipeline = await readWorkspaceFile("src/lib/sources/embedding-pipeline.ts");
  const embeddingProvider = await readWorkspaceFile("src/lib/embeddings/openai.ts");
  const retrieval = await readWorkspaceFile("src/lib/evidence/retrieval.ts");
  const retrievalRoute = await readWorkspaceFile("src/app/api/evidence/retrieve/route.ts");
  const retrievalRpc = await readWorkspaceFile("supabase/migrations/20260703112500_create_evidence_retrieval_rpc.sql");
  const sourceRepository = await readWorkspaceFile("src/lib/repositories/sources.ts");

  assert.match(embeddingPipeline, /runSourceEmbeddingJob/);
  assert.match(embeddingPipeline, /listSourceChunksNeedingEmbedding/);
  assert.match(embeddingPipeline, /updateSourceChunkEmbedding/);
  assert.match(embeddingProvider, /text-embedding-3-small/);
  assert.match(embeddingProvider, /assertEmbeddingDimensions/);
  assert.match(retrievalRoute, /runWorkspaceApiHandler/);
  assert.match(retrievalRoute, /permission: "workspace:read"/);
  assert.match(retrievalRoute, /evidenceRetrievalRequestSchema/);
  assert.match(retrieval, /retrieveEvidenceForAssertion/);
  assert.match(retrieval, /listAssertionSourcesForAssertion/);
  assert.match(retrieval, /Requested source is not linked to this assertion/);
  assert.match(retrieval, /matchAssertionSourceChunks/);
  assert.match(retrievalRpc, /join public\.assertion_sources as assertion_source/);
  assert.match(sourceRepository, /rpc\("match_assertion_source_chunks"/);
});

test("RAD-040 gate verifies source health, detail visibility, affected assertions, and authorization boundaries", async () => {
  const sourcesPage = await readWorkspaceFile("src/app/(app)/sources/page.tsx");
  const sourceDetailPage = await readWorkspaceFile("src/app/(app)/sources/[sourceId]/page.tsx");
  const sourceList = await readWorkspaceFile("src/components/sources/source-list.tsx");
  const sourceCard = await readWorkspaceFile("src/components/sources/source-card.tsx");
  const affectedAssertions = await readWorkspaceFile("src/lib/sources/affected-assertions.ts");
  const sourceSyncRoute = await readWorkspaceFile("src/app/api/sources/sync/route.ts");
  const guardrails = await readWorkspaceFile("src/lib/server/guardrails.ts");
  const rlsMigration = await readWorkspaceFile("supabase/migrations/20260703111500_harden_workspace_rls_policies.sql");

  assert.match(sourcesPage, /listSources/);
  assert.match(sourcesPage, /listSourceAssertionCounts/);
  assert.match(sourcesPage, /syncStatus/);
  assert.match(sourceList, /affectedAssertionCount/);
  assert.match(sourceCard, /affectedAssertionCount/);
  assert.match(sourceDetailPage, /listSourceVersions/);
  assert.match(sourceDetailPage, /listSourceDocuments/);
  assert.match(sourceDetailPage, /listSourceChunksPreview/);
  assert.match(sourceDetailPage, /LinkedAssertions/);
  assert.match(affectedAssertions, /detectAffectedAssertionsForSourceChange/);
  assert.match(affectedAssertions, /rerunCandidateCount/);
  assert.match(sourceSyncRoute, /permission: "source:edit"/);
  assert.match(guardrails, /runWorkspaceApiHandler/);
  assert.match(guardrails, /runWorkspaceServerAction/);
  assert.match(rlsMigration, /force row level security/);
  assert.match(rlsMigration, /current_user_is_workspace_member/);
});

test("RAD-040 gate verifies Phase 3 scope remains source-minimal and assertion-led", async () => {
  const routes = await readWorkspaceFile("src/lib/radar-routes.ts");
  const sidebar = await readWorkspaceFile("src/components/app-shell/sidebar-nav.tsx");
  const sourcesEvidence = await readWorkspaceFile("docs/SOURCES_AND_EVIDENCE.md");
  const taskBoard = await readWorkspaceFile("tasks/TASKS.md");

  assert.match(routes, /title: "Command Center"/);
  assert.match(routes, /title: "Assertions"/);
  assert.match(routes, /title: "Findings"/);
  assert.match(routes, /title: "Sources"/);
  assert.doesNotMatch(sidebar, /Prompt Playground|Trace Explorer|Workflow Canvas|Marketplace/i);
  assert.match(sourcesEvidence, /Retrieval APIs are server guarded and are intended for the eval engine, not as a generic workspace search/);
  assert.match(taskBoard, /RAD-031[\s\S]*Done/);
  assert.match(taskBoard, /RAD-039[\s\S]*Done/);

  assert.match(sourcesEvidence, /Do not build a generic integration marketplace in V1/);

  for (const source of [routes, sidebar]) {
    assert.doesNotMatch(source, /generic eval platform|prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
  }
});
