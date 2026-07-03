import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-037 adds a workspace and assertion scoped vector retrieval RPC", async () => {
  const migration = await readWorkspaceFile("supabase/migrations/20260703112500_create_evidence_retrieval_rpc.sql");
  const repository = await readWorkspaceFile("src/lib/repositories/sources.ts");

  assert.match(migration, /create or replace function public\.match_assertion_source_chunks/);
  assert.match(migration, /p_workspace_id uuid/);
  assert.match(migration, /p_assertion_id uuid/);
  assert.match(migration, /p_query_embedding extensions\.vector\(1536\)/);
  assert.match(migration, /join public\.assertion_sources as assertion_source/);
  assert.match(migration, /assertion_source\.assertion_id = p_assertion_id/);
  assert.match(migration, /chunk\.workspace_id = p_workspace_id/);
  assert.match(migration, /chunk\.embedding is not null/);
  assert.match(migration, /order by chunk\.embedding <=> p_query_embedding/);
  assert.match(repository, /matchAssertionSourceChunks/);
  assert.match(repository, /\.rpc\("match_assertion_source_chunks"/);
  assert.match(repository, /toPgVectorLiteral\(input\.queryEmbedding\)/);
});

test("RAD-037 retrieval service validates assertion test case and linked sources", async () => {
  const retrieval = await readWorkspaceFile("src/lib/evidence/retrieval.ts");
  const assertions = await readWorkspaceFile("src/lib/repositories/assertions.ts");

  assert.match(retrieval, /server-only/);
  assert.match(retrieval, /retrieveEvidenceForAssertion/);
  assert.match(retrieval, /getAssertionById/);
  assert.match(retrieval, /getTestCaseById/);
  assert.match(retrieval, /listAssertionSourcesForAssertion/);
  assert.match(retrieval, /allowedSourceIds/);
  assert.match(retrieval, /Requested source is not linked to this assertion/);
  assert.match(retrieval, /buildRetrievalText/);
  assert.match(retrieval, /provider\.embedTexts/);
  assert.match(retrieval, /matchAssertionSourceChunks/);
  assert.match(assertions, /listAssertionSourcesForAssertion/);
  assert.match(assertions, /getTestCaseById/);
});

test("RAD-037 returns bounded evidence matches with citations", async () => {
  const retrieval = await readWorkspaceFile("src/lib/evidence/retrieval.ts");
  const route = await readWorkspaceFile("src/app/api/evidence/retrieve/route.ts");

  assert.match(retrieval, /EvidenceRetrievalMatch/);
  assert.match(retrieval, /boundedExcerpt/);
  assert.match(retrieval, /content\.slice\(0, 1997\)/);
  assert.match(retrieval, /citation: \{/);
  assert.match(retrieval, /sourceId: match\.sourceId/);
  assert.match(retrieval, /sourceDocumentId: match\.sourceDocumentId/);
  assert.match(retrieval, /chunkId: match\.chunkId/);
  assert.match(retrieval, /contentHash: match\.contentHash/);
  assert.match(route, /runWorkspaceApiHandler/);
  assert.match(route, /permission: "workspace:read"/);
  assert.match(route, /evidenceRetrievalRequestSchema/);
  assert.match(route, /EvidenceRetrievalError/);
});

test("RAD-037 documents evidence retrieval and avoids generic search scope", async () => {
  const retrieval = await readWorkspaceFile("src/lib/evidence/retrieval.ts");
  const route = await readWorkspaceFile("src/app/api/evidence/retrieve/route.ts");
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");
  const sourcesEvidence = await readWorkspaceFile("docs/SOURCES_AND_EVIDENCE.md");

  assert.match(dataModel, /RAD-037/);
  assert.match(sourcesEvidence, /RAD-037/);
  assert.match(sourcesEvidence, /assertion-linked sources/);

  for (const source of [retrieval, route]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});
