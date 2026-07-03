import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkspaceFile(relativePath) {
  return readFile(relativePath, "utf8");
}

test("RAD-036 adds a server-only OpenAI embedding provider", async () => {
  const provider = await readWorkspaceFile("src/lib/embeddings/openai.ts");

  assert.match(provider, /server-only/);
  assert.match(provider, /defaultEmbeddingModel = "text-embedding-3-small"/);
  assert.match(provider, /defaultEmbeddingDimensions = 1536/);
  assert.match(provider, /https:\/\/api\.openai\.com\/v1\/embeddings/);
  assert.match(provider, /Authorization: `Bearer \$\{apiKey\}`/);
  assert.match(provider, /encoding_format: "float"/);
  assert.match(provider, /openAIEmbeddingResponseSchema/);
  assert.match(provider, /assertEmbeddingDimensions/);
});

test("RAD-036 indexes only source chunks missing embeddings", async () => {
  const repository = await readWorkspaceFile("src/lib/repositories/sources.ts");
  const pipeline = await readWorkspaceFile("src/lib/sources/embedding-pipeline.ts");

  assert.match(repository, /export async function listSourceChunksNeedingEmbedding/);
  assert.match(repository, /\.from\("source_chunks"\)/);
  assert.match(repository, /\.eq\("workspace_id", workspaceId\)/);
  assert.match(repository, /\.eq\("source_id", sourceId\)/);
  assert.match(repository, /\.is\("embedding", null\)/);
  assert.match(repository, /export async function updateSourceChunkEmbedding/);
  assert.match(repository, /toPgVectorLiteral/);
  assert.match(pipeline, /runSourceEmbeddingJob/);
  assert.match(pipeline, /listSourceChunksNeedingEmbedding/);
  assert.match(pipeline, /updateSourceChunkEmbedding/);
  assert.match(pipeline, /status: "up_to_date"/);
});

test("RAD-036 batches embeddings and stores bounded pgvector metadata", async () => {
  const pipeline = await readWorkspaceFile("src/lib/sources/embedding-pipeline.ts");
  const repository = await readWorkspaceFile("src/lib/repositories/sources.ts");
  const dataModel = await readWorkspaceFile("docs/DATA_MODEL.md");

  assert.match(pipeline, /batchSize = Math\.min\(Math\.max\(options\.batchSize \?\? 32, 1\), 64\)/);
  assert.match(pipeline, /provider\.embedTexts/);
  assert.match(pipeline, /assertEmbeddingDimensions\(embedding, provider\.dimensions\)/);
  assert.match(pipeline, /embeddingJobId: jobId/);
  assert.match(pipeline, /embeddingReason: input\.reason/);
  assert.match(pipeline, /contentHash: chunk\.contentHash/);
  assert.match(repository, /metadata: input\.metadata/);
  assert.match(dataModel, /RAD-036/);
  assert.match(dataModel, /pgvector/);
});

test("RAD-036 keeps embedding infrastructure source-minimal and secret-safe", async () => {
  const provider = await readWorkspaceFile("src/lib/embeddings/openai.ts");
  const pipeline = await readWorkspaceFile("src/lib/sources/embedding-pipeline.ts");
  const sourcesEvidence = await readWorkspaceFile("docs/SOURCES_AND_EVIDENCE.md");

  assert.match(sourcesEvidence, /RAD-036/);
  assert.match(sourcesEvidence, /missing embeddings/);

  for (const source of [provider, pipeline]) {
    assert.doesNotMatch(source, /prompt playground|trace explorer|workflow canvas|integration marketplace/i);
    assert.doesNotMatch(source, /service_role|sb_secret/i);
    assert.doesNotMatch(source, /console\.log|console\.error/);
  }
});
