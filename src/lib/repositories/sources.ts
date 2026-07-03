import "server-only";

import {
  type CreateSourceInput,
  type RadarSource,
  type RadarSourceChunk,
  type RadarSourceDocument,
  type RadarSourceVersion,
  type SourceChunkInput,
  type SourceDocumentInput,
  type SourceDocumentStatus,
  type SourceSyncStatus,
  type SourceType,
  type SourceVersionInput,
} from "@/lib/sources/schema";
import {
  sourceChunkCreateRequestSchema,
  sourceChunkResponseSchema,
  sourceCreateRequestSchema,
  sourceDocumentCreateRequestSchema,
  sourceDocumentResponseSchema,
  sourceResponseSchema,
  sourceUpdateRequestSchema,
  sourceVersionCreateRequestSchema,
  sourceVersionResponseSchema,
} from "@/lib/validation";
import {
  assertRepositorySuccess,
  jsonRecord,
  optionalNumber,
  optionalString,
  RadarRepositoryError,
  requireRepositoryRow,
  type JsonRecord,
  type RadarRepositoryClient,
} from "@/lib/repositories/client";

type SourceRow = {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  type: SourceType;
  sync_status: SourceSyncStatus;
  origin_uri: string | null;
  content_hash: string | null;
  last_synced_at: string | null;
  last_sync_error: string | null;
  created_by: string;
};

type SourceSyncTargetRow = SourceRow & {
  config: unknown;
  metadata: unknown;
};

type SourceVersionRow = {
  id: string;
  workspace_id: string;
  source_id: string;
  version_number: number;
  sync_status: SourceSyncStatus;
  content_hash: string;
  document_count: number;
  chunk_count: number;
};

type SourceVersionDetailRow = SourceVersionRow & {
  sync_started_at: string | null;
  sync_completed_at: string | null;
  sync_error: string | null;
  created_at: string;
};

type SourceDocumentRow = {
  id: string;
  workspace_id: string;
  source_id: string;
  source_version_id: string;
  title: string;
  document_uri: string | null;
  mime_type: string | null;
  storage_path: string | null;
  status: SourceDocumentStatus;
  content_hash: string;
  byte_size: number | null;
};

type SourceDocumentDetailRow = SourceDocumentRow & {
  extracted_at: string | null;
  extraction_error: string | null;
  created_at: string;
};

type SourceChunkRow = {
  id: string;
  workspace_id: string;
  source_id: string;
  source_document_id: string;
  chunk_index: number;
  content: string;
  content_hash: string;
  token_count: number | null;
};

type SourceAssertionCountRow = {
  source_id: string;
};

type SourceVersionNumberRow = {
  version_number: number;
};

type SourceSyncStateInput = {
  syncStatus: SourceSyncStatus;
  contentHash?: string | null;
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
};

const sourceSelect =
  "id, workspace_id, name, description, type, sync_status, origin_uri, content_hash, last_synced_at, last_sync_error, created_by";
const sourceSyncTargetSelect = `${sourceSelect}, config, metadata`;

export async function listSources(client: RadarRepositoryClient, workspaceId: string) {
  const { data, error } = await client
    .from("sources")
    .select(sourceSelect)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .returns<SourceRow[]>();

  assertRepositorySuccess(error, "Unable to list sources");
  return (data ?? []).map(mapSourceRow);
}

export async function listSourceAssertionCounts(client: RadarRepositoryClient, workspaceId: string) {
  const { data, error } = await client
    .from("assertion_sources")
    .select("source_id")
    .eq("workspace_id", workspaceId)
    .returns<SourceAssertionCountRow[]>();

  assertRepositorySuccess(error, "Unable to list source assertion counts");

  return (data ?? []).reduce<Record<string, number>>((counts, row) => {
    counts[row.source_id] = (counts[row.source_id] ?? 0) + 1;
    return counts;
  }, {});
}

export async function getSourceById(client: RadarRepositoryClient, workspaceId: string, sourceId: string) {
  const { data, error } = await client
    .from("sources")
    .select(sourceSelect)
    .eq("workspace_id", workspaceId)
    .eq("id", sourceId)
    .maybeSingle<SourceRow>();

  assertRepositorySuccess(error, "Unable to load source");
  return data ? mapSourceRow(data) : null;
}

export async function getSourceSyncTarget(client: RadarRepositoryClient, workspaceId: string, sourceId: string) {
  const { data, error } = await client
    .from("sources")
    .select(sourceSyncTargetSelect)
    .eq("workspace_id", workspaceId)
    .eq("id", sourceId)
    .maybeSingle<SourceSyncTargetRow>();

  assertRepositorySuccess(error, "Unable to load source sync target");
  return data ? mapSourceSyncTargetRow(data) : null;
}

export async function createSource(
  client: RadarRepositoryClient,
  workspaceId: string,
  createdBy: string,
  input: CreateSourceInput,
) {
  const parsedInput = sourceCreateRequestSchema.parse(input);
  const { data, error } = await client
    .from("sources")
    .insert({
      workspace_id: workspaceId,
      name: parsedInput.name,
      description: parsedInput.description ?? null,
      type: parsedInput.type,
      sync_status: "draft",
      origin_uri: parsedInput.originUri ?? null,
      config: parsedInput.config,
      metadata: parsedInput.metadata,
      created_by: createdBy,
    })
    .select(sourceSelect)
    .single<SourceRow>();

  assertRepositorySuccess(error, "Unable to create source");
  return mapSourceRow(requireRepositoryRow(data, "Source insert returned no row"));
}

export async function updateSource(
  client: RadarRepositoryClient,
  workspaceId: string,
  sourceId: string,
  input: Partial<CreateSourceInput>,
) {
  const parsedInput = sourceUpdateRequestSchema.parse(input);
  const updatePayload: Record<string, unknown> = {};

  if (parsedInput.name !== undefined) {
    updatePayload.name = parsedInput.name;
  }

  if (parsedInput.description !== undefined) {
    updatePayload.description = parsedInput.description;
  }

  if (parsedInput.type !== undefined) {
    updatePayload.type = parsedInput.type;
  }

  if (parsedInput.originUri !== undefined) {
    updatePayload.origin_uri = parsedInput.originUri;
  }

  if (parsedInput.config !== undefined) {
    updatePayload.config = parsedInput.config;
  }

  if (parsedInput.metadata !== undefined) {
    updatePayload.metadata = parsedInput.metadata;
  }

  const { data, error } = await client
    .from("sources")
    .update(updatePayload)
    .eq("workspace_id", workspaceId)
    .eq("id", sourceId)
    .select(sourceSelect)
    .single<SourceRow>();

  assertRepositorySuccess(error, "Unable to update source");
  return mapSourceRow(requireRepositoryRow(data, "Source update returned no row"));
}

export async function deleteSource(client: RadarRepositoryClient, workspaceId: string, sourceId: string) {
  const { error } = await client.from("sources").delete().eq("workspace_id", workspaceId).eq("id", sourceId);
  assertRepositorySuccess(error, "Unable to delete source");
}

export async function getNextSourceVersionNumber(client: RadarRepositoryClient, workspaceId: string, sourceId: string) {
  const { data, error } = await client
    .from("source_versions")
    .select("version_number")
    .eq("workspace_id", workspaceId)
    .eq("source_id", sourceId)
    .order("version_number", { ascending: false })
    .limit(1)
    .returns<SourceVersionNumberRow[]>();

  assertRepositorySuccess(error, "Unable to load next source version");
  return (data?.[0]?.version_number ?? 0) + 1;
}

export async function getLatestSourceVersion(client: RadarRepositoryClient, workspaceId: string, sourceId: string) {
  const { data, error } = await client
    .from("source_versions")
    .select("id, workspace_id, source_id, version_number, sync_status, content_hash, document_count, chunk_count")
    .eq("workspace_id", workspaceId)
    .eq("source_id", sourceId)
    .order("version_number", { ascending: false })
    .limit(1)
    .returns<SourceVersionRow[]>();

  assertRepositorySuccess(error, "Unable to load latest source version");
  return data?.[0] ? mapSourceVersionRow(data[0]) : null;
}

export async function getSourceVersionByContentHash(
  client: RadarRepositoryClient,
  workspaceId: string,
  sourceId: string,
  contentHash: string,
) {
  const { data, error } = await client
    .from("source_versions")
    .select("id, workspace_id, source_id, version_number, sync_status, content_hash, document_count, chunk_count")
    .eq("workspace_id", workspaceId)
    .eq("source_id", sourceId)
    .eq("content_hash", contentHash)
    .maybeSingle<SourceVersionRow>();

  assertRepositorySuccess(error, "Unable to load source version by content hash");
  return data ? mapSourceVersionRow(data) : null;
}

export async function updateSourceSyncState(
  client: RadarRepositoryClient,
  workspaceId: string,
  sourceId: string,
  input: SourceSyncStateInput,
) {
  const updatePayload: Record<string, unknown> = {
    sync_status: input.syncStatus,
  };

  if (input.contentHash !== undefined) {
    updatePayload.content_hash = input.contentHash;
  }

  if (input.lastSyncedAt !== undefined) {
    updatePayload.last_synced_at = input.lastSyncedAt;
  }

  if (input.lastSyncError !== undefined) {
    updatePayload.last_sync_error = input.lastSyncError;
  }

  const { data, error } = await client
    .from("sources")
    .update(updatePayload)
    .eq("workspace_id", workspaceId)
    .eq("id", sourceId)
    .select(sourceSelect)
    .single<SourceRow>();

  assertRepositorySuccess(error, "Unable to update source sync state");
  return mapSourceRow(requireRepositoryRow(data, "Source sync update returned no row"));
}

export async function createSourceVersion(client: RadarRepositoryClient, workspaceId: string, input: SourceVersionInput) {
  const parsedInput = sourceVersionCreateRequestSchema.parse(input);
  const { data, error } = await client
    .from("source_versions")
    .insert({
      workspace_id: workspaceId,
      source_id: parsedInput.sourceId,
      version_number: parsedInput.versionNumber,
      sync_status: parsedInput.syncStatus,
      content_hash: parsedInput.contentHash,
      document_count: parsedInput.documentCount,
      chunk_count: parsedInput.chunkCount,
      metadata: parsedInput.metadata,
    })
    .select("id, workspace_id, source_id, version_number, sync_status, content_hash, document_count, chunk_count")
    .single<SourceVersionRow>();

  assertRepositorySuccess(error, "Unable to create source version");
  return mapSourceVersionRow(requireRepositoryRow(data, "Source version insert returned no row"));
}

export async function createSourceDocument(client: RadarRepositoryClient, workspaceId: string, input: SourceDocumentInput) {
  const parsedInput = sourceDocumentCreateRequestSchema.parse(input);
  const { data, error } = await client
    .from("source_documents")
    .insert({
      workspace_id: workspaceId,
      source_id: parsedInput.sourceId,
      source_version_id: parsedInput.sourceVersionId,
      title: parsedInput.title,
      document_uri: parsedInput.documentUri ?? null,
      mime_type: parsedInput.mimeType ?? null,
      storage_path: parsedInput.storagePath ?? null,
      status: parsedInput.status,
      content_hash: parsedInput.contentHash,
      byte_size: parsedInput.byteSize ?? null,
      metadata: parsedInput.metadata,
    })
    .select("id, workspace_id, source_id, source_version_id, title, document_uri, mime_type, storage_path, status, content_hash, byte_size")
    .single<SourceDocumentRow>();

  assertRepositorySuccess(error, "Unable to create source document");
  return mapSourceDocumentRow(requireRepositoryRow(data, "Source document insert returned no row"));
}

export async function createSourceChunk(client: RadarRepositoryClient, workspaceId: string, input: SourceChunkInput) {
  const parsedInput = sourceChunkCreateRequestSchema.parse(input);
  const { data, error } = await client
    .from("source_chunks")
    .insert({
      workspace_id: workspaceId,
      source_id: parsedInput.sourceId,
      source_document_id: parsedInput.sourceDocumentId,
      chunk_index: parsedInput.chunkIndex,
      content: parsedInput.content,
      content_hash: parsedInput.contentHash,
      token_count: parsedInput.tokenCount ?? null,
      metadata: parsedInput.metadata,
    })
    .select("id, workspace_id, source_id, source_document_id, chunk_index, content, content_hash, token_count")
    .single<SourceChunkRow>();

  assertRepositorySuccess(error, "Unable to create source chunk");
  return mapSourceChunkRow(requireRepositoryRow(data, "Source chunk insert returned no row"));
}

type SourceChunkForEmbeddingRow = SourceChunkRow & {
  metadata: unknown;
};

export type RadarSourceChunkForEmbedding = RadarSourceChunk & {
  metadata: JsonRecord;
};

type SourceChunkEmbeddingInput = {
  embedding: readonly number[];
  metadata: JsonRecord;
};

type EvidenceChunkMatchRow = {
  chunk_id: string;
  source_id: string;
  source_name: string;
  source_type: SourceType;
  source_document_id: string;
  document_title: string;
  document_uri: string | null;
  storage_path: string | null;
  chunk_index: number;
  content: string;
  content_hash: string;
  token_count: number | null;
  similarity: number;
};

export type RadarEvidenceChunkMatch = {
  chunkId: string;
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  sourceDocumentId: string;
  documentTitle: string;
  documentUri?: string;
  storagePath?: string;
  chunkIndex: number;
  content: string;
  contentHash: string;
  tokenCount?: number;
  similarity: number;
};

export type RadarSourceVersionDetail = RadarSourceVersion & {
  syncStartedAt?: string;
  syncCompletedAt?: string;
  syncError?: string;
  createdAt: string;
};

export type RadarSourceDocumentDetail = RadarSourceDocument & {
  extractedAt?: string;
  extractionError?: string;
  createdAt: string;
};

type MatchAssertionSourceChunksInput = {
  assertionId: string;
  queryEmbedding: readonly number[];
  limit?: number;
  sourceIds?: readonly string[];
};

export async function listSourceChunksNeedingEmbedding(
  client: RadarRepositoryClient,
  workspaceId: string,
  sourceId: string,
  options: { limit?: number } = {},
) {
  const { data, error } = await client
    .from("source_chunks")
    .select("id, workspace_id, source_id, source_document_id, chunk_index, content, content_hash, token_count, metadata")
    .eq("workspace_id", workspaceId)
    .eq("source_id", sourceId)
    .is("embedding", null)
    .order("chunk_index", { ascending: true })
    .limit(options.limit ?? 100)
    .returns<SourceChunkForEmbeddingRow[]>();

  assertRepositorySuccess(error, "Unable to list source chunks needing embeddings");
  return (data ?? []).map(mapSourceChunkForEmbeddingRow);
}

export async function updateSourceChunkEmbedding(
  client: RadarRepositoryClient,
  workspaceId: string,
  chunkId: string,
  input: SourceChunkEmbeddingInput,
) {
  const { data, error } = await client
    .from("source_chunks")
    .update({
      embedding: toPgVectorLiteral(input.embedding),
      metadata: input.metadata,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", chunkId)
    .select("id, workspace_id, source_id, source_document_id, chunk_index, content, content_hash, token_count")
    .single<SourceChunkRow>();

  assertRepositorySuccess(error, "Unable to update source chunk embedding");
  return mapSourceChunkRow(requireRepositoryRow(data, "Source chunk embedding update returned no row"));
}

export async function matchAssertionSourceChunks(
  client: RadarRepositoryClient,
  workspaceId: string,
  input: MatchAssertionSourceChunksInput,
) {
  const { data, error } = await client
    .rpc("match_assertion_source_chunks", {
      p_workspace_id: workspaceId,
      p_assertion_id: input.assertionId,
      p_query_embedding: toPgVectorLiteral(input.queryEmbedding),
      p_match_count: input.limit ?? 8,
      p_source_ids: input.sourceIds && input.sourceIds.length > 0 ? [...input.sourceIds] : null,
    })
    .returns<EvidenceChunkMatchRow[]>();

  assertRepositorySuccess(error, "Unable to retrieve source evidence");
  const rows = Array.isArray(data) ? data : [];

  return rows.map(mapEvidenceChunkMatchRow);
}

export async function listSourceVersions(
  client: RadarRepositoryClient,
  workspaceId: string,
  sourceId: string,
  options: { limit?: number } = {},
) {
  const { data, error } = await client
    .from("source_versions")
    .select(
      "id, workspace_id, source_id, version_number, sync_status, content_hash, document_count, chunk_count, sync_started_at, sync_completed_at, sync_error, created_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("source_id", sourceId)
    .order("version_number", { ascending: false })
    .limit(options.limit ?? 10)
    .returns<SourceVersionDetailRow[]>();

  assertRepositorySuccess(error, "Unable to list source versions");
  return (data ?? []).map(mapSourceVersionDetailRow);
}

export async function listSourceDocuments(
  client: RadarRepositoryClient,
  workspaceId: string,
  sourceId: string,
  options: { limit?: number } = {},
) {
  const { data, error } = await client
    .from("source_documents")
    .select(
      "id, workspace_id, source_id, source_version_id, title, document_uri, mime_type, storage_path, status, content_hash, byte_size, extracted_at, extraction_error, created_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("source_id", sourceId)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 20)
    .returns<SourceDocumentDetailRow[]>();

  assertRepositorySuccess(error, "Unable to list source documents");
  return (data ?? []).map(mapSourceDocumentDetailRow);
}

export async function listSourceChunksPreview(
  client: RadarRepositoryClient,
  workspaceId: string,
  sourceId: string,
  options: { limit?: number } = {},
) {
  const { data, error } = await client
    .from("source_chunks")
    .select("id, workspace_id, source_id, source_document_id, chunk_index, content, content_hash, token_count")
    .eq("workspace_id", workspaceId)
    .eq("source_id", sourceId)
    .order("chunk_index", { ascending: true })
    .limit(options.limit ?? 6)
    .returns<SourceChunkRow[]>();

  assertRepositorySuccess(error, "Unable to list source chunk preview");
  return (data ?? []).map(mapSourceChunkRow);
}

function mapSourceRow(row: SourceRow): RadarSource {
  return sourceResponseSchema.parse({
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    description: optionalString(row.description),
    type: row.type,
    syncStatus: row.sync_status,
    originUri: optionalString(row.origin_uri),
    contentHash: optionalString(row.content_hash),
    lastSyncedAt: optionalString(row.last_synced_at),
    lastSyncError: optionalString(row.last_sync_error),
    createdBy: row.created_by,
  });
}

function mapSourceSyncTargetRow(row: SourceSyncTargetRow) {
  return {
    ...mapSourceRow(row),
    config: jsonRecord(row.config),
    metadata: jsonRecord(row.metadata),
  };
}

function mapSourceVersionRow(row: SourceVersionRow): RadarSourceVersion {
  return sourceVersionResponseSchema.parse({
    id: row.id,
    workspaceId: row.workspace_id,
    sourceId: row.source_id,
    versionNumber: row.version_number,
    syncStatus: row.sync_status,
    contentHash: row.content_hash,
    documentCount: row.document_count,
    chunkCount: row.chunk_count,
  });
}

function mapSourceVersionDetailRow(row: SourceVersionDetailRow): RadarSourceVersionDetail {
  return {
    ...mapSourceVersionRow(row),
    syncStartedAt: optionalString(row.sync_started_at),
    syncCompletedAt: optionalString(row.sync_completed_at),
    syncError: optionalString(row.sync_error),
    createdAt: row.created_at,
  };
}

function mapSourceDocumentRow(row: SourceDocumentRow): RadarSourceDocument {
  return sourceDocumentResponseSchema.parse({
    id: row.id,
    workspaceId: row.workspace_id,
    sourceId: row.source_id,
    sourceVersionId: row.source_version_id,
    title: row.title,
    documentUri: optionalString(row.document_uri),
    mimeType: optionalString(row.mime_type),
    storagePath: optionalString(row.storage_path),
    status: row.status,
    contentHash: row.content_hash,
    byteSize: optionalNumber(row.byte_size),
  });
}

function mapSourceDocumentDetailRow(row: SourceDocumentDetailRow): RadarSourceDocumentDetail {
  return {
    ...mapSourceDocumentRow(row),
    extractedAt: optionalString(row.extracted_at),
    extractionError: optionalString(row.extraction_error),
    createdAt: row.created_at,
  };
}

function mapSourceChunkRow(row: SourceChunkRow): RadarSourceChunk {
  return sourceChunkResponseSchema.parse({
    id: row.id,
    workspaceId: row.workspace_id,
    sourceId: row.source_id,
    sourceDocumentId: row.source_document_id,
    chunkIndex: row.chunk_index,
    content: row.content,
    contentHash: row.content_hash,
    tokenCount: optionalNumber(row.token_count),
  });
}

function mapSourceChunkForEmbeddingRow(row: SourceChunkForEmbeddingRow): RadarSourceChunkForEmbedding {
  return {
    ...mapSourceChunkRow(row),
    metadata: jsonRecord(row.metadata),
  };
}

function mapEvidenceChunkMatchRow(row: EvidenceChunkMatchRow): RadarEvidenceChunkMatch {
  return {
    chunkId: row.chunk_id,
    sourceId: row.source_id,
    sourceName: row.source_name,
    sourceType: row.source_type,
    sourceDocumentId: row.source_document_id,
    documentTitle: row.document_title,
    documentUri: optionalString(row.document_uri),
    storagePath: optionalString(row.storage_path),
    chunkIndex: row.chunk_index,
    content: row.content,
    contentHash: row.content_hash,
    tokenCount: optionalNumber(row.token_count),
    similarity: row.similarity,
  };
}

function toPgVectorLiteral(embedding: readonly number[]) {
  return `[${embedding.map(formatVectorValue).join(",")}]`;
}

function formatVectorValue(value: number) {
  if (!Number.isFinite(value)) {
    throw new RadarRepositoryError("Embedding contains a non-finite vector value.");
  }

  return Number(value).toString();
}
