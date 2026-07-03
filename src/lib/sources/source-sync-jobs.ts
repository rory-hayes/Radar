import "server-only";

import { randomUUID } from "node:crypto";

import {
  createSourceChunk,
  createSourceDocument,
  createSourceVersion,
  getNextSourceVersionNumber,
  getSourceSyncTarget,
  getSourceVersionByContentHash,
  updateSourceSyncState,
  type JsonRecord,
  type RadarRepositoryClient,
} from "@/lib/repositories";
import { chunkSourceText } from "@/lib/sources/text-chunking";
import { crawlUrlSource, hashText, type UrlCrawlerLimits } from "@/lib/sources/url-crawler";
import { persistUrlCrawlResult } from "@/lib/sources/url-ingestion";

export const sourceSyncReasons = ["manual", "scheduled", "source_change", "initial"] as const;

export type SourceSyncReason = (typeof sourceSyncReasons)[number];

export type SourceSyncJobInput = {
  workspaceId: string;
  sourceId: string;
  reason: SourceSyncReason;
  requestedByUserId?: string;
  force?: boolean;
};

export type SourceSyncJobOptions = {
  jobId?: string;
  urlCrawler?: UrlCrawlerLimits & {
    fetcher?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  };
  maxChunkCharacters?: number;
};

export type SourceSyncJobResult = {
  jobId: string;
  sourceId: string;
  status: "changed" | "unchanged" | "skipped" | "error";
  contentHash?: string;
  previousContentHash?: string;
  versionNumber?: number;
  documentCount?: number;
  chunkCount?: number;
  reason?: string;
};

type SyncableSourceType = "url" | "manual_text";
type SourceSyncTarget = NonNullable<Awaited<ReturnType<typeof getSourceSyncTarget>>>;

export async function runSourceSyncJob(
  client: RadarRepositoryClient,
  input: SourceSyncJobInput,
  options: SourceSyncJobOptions = {},
): Promise<SourceSyncJobResult> {
  const jobId = options.jobId ?? randomUUID();
  const source = await getSourceSyncTarget(client, input.workspaceId, input.sourceId);

  if (!source) {
    return {
      jobId,
      sourceId: input.sourceId,
      status: "skipped",
      reason: "source_not_found",
    };
  }

  if (source.syncStatus === "paused" || source.syncStatus === "archived") {
    return {
      jobId,
      sourceId: source.id,
      status: "skipped",
      contentHash: source.contentHash,
      reason: `source_${source.syncStatus}`,
    };
  }

  if (!isSyncableSourceType(source.type)) {
    return {
      jobId,
      sourceId: source.id,
      status: "skipped",
      contentHash: source.contentHash,
      reason: skippedReasonForSourceType(source.type),
    };
  }

  await updateSourceSyncState(client, input.workspaceId, source.id, {
    syncStatus: "syncing",
    lastSyncError: null,
  });

  try {
    if (source.type === "url") {
      return await syncUrlSource(client, source, input, jobId, options);
    }

    return await syncManualTextSource(client, source, input, jobId, options);
  } catch (error) {
    await updateSourceSyncState(client, input.workspaceId, source.id, {
      syncStatus: "error",
      lastSyncError: syncErrorMessage(error),
    });

    return {
      jobId,
      sourceId: source.id,
      status: "error",
      previousContentHash: source.contentHash,
      reason: syncErrorMessage(error),
    };
  }
}

async function syncUrlSource(
  client: RadarRepositoryClient,
  source: SourceSyncTarget,
  input: SourceSyncJobInput,
  jobId: string,
  options: SourceSyncJobOptions,
): Promise<SourceSyncJobResult> {
  if (!source.originUri) {
    throw new SourceSyncJobError("url_source_missing_origin");
  }

  const crawlResult = await crawlUrlSource(source.originUri, options.urlCrawler);
  const unchangedVersion = await getUnchangedVersion(client, input.workspaceId, source.id, crawlResult.contentHash, input.force);

  if (unchangedVersion) {
    await markSourceUnchanged(client, input.workspaceId, source.id, crawlResult.contentHash);

    return {
      jobId,
      sourceId: source.id,
      status: "unchanged",
      contentHash: crawlResult.contentHash,
      previousContentHash: source.contentHash,
      versionNumber: unchangedVersion.versionNumber,
      documentCount: unchangedVersion.documentCount,
      chunkCount: unchangedVersion.chunkCount,
    };
  }

  const persisted = await persistUrlCrawlResult(client, input.workspaceId, source.id, crawlResult, {
    maxChunkCharacters: options.maxChunkCharacters,
  });

  return {
    jobId,
    sourceId: source.id,
    status: "changed",
    contentHash: crawlResult.contentHash,
    previousContentHash: source.contentHash,
    versionNumber: persisted.sourceVersion.versionNumber,
    documentCount: persisted.documentCount,
    chunkCount: persisted.chunkCount,
  };
}

async function syncManualTextSource(
  client: RadarRepositoryClient,
  source: SourceSyncTarget,
  input: SourceSyncJobInput,
  jobId: string,
  options: SourceSyncJobOptions,
): Promise<SourceSyncJobResult> {
  const manualText = typeof source.config.manualText === "string" ? source.config.manualText.trim() : "";

  if (manualText.length < 20) {
    throw new SourceSyncJobError("manual_text_source_missing_content");
  }

  const contentHash = hashText(manualText);
  const unchangedVersion = await getUnchangedVersion(client, input.workspaceId, source.id, contentHash, input.force);

  if (unchangedVersion) {
    await markSourceUnchanged(client, input.workspaceId, source.id, contentHash);

    return {
      jobId,
      sourceId: source.id,
      status: "unchanged",
      contentHash,
      previousContentHash: source.contentHash,
      versionNumber: unchangedVersion.versionNumber,
      documentCount: unchangedVersion.documentCount,
      chunkCount: unchangedVersion.chunkCount,
    };
  }

  const chunks = chunkSourceText(manualText, options.maxChunkCharacters ?? 4000);
  const versionNumber = await getNextSourceVersionNumber(client, input.workspaceId, source.id);
  const sourceVersion = await createSourceVersion(client, input.workspaceId, {
    sourceId: source.id,
    versionNumber,
    syncStatus: "synced",
    contentHash,
    documentCount: 1,
    chunkCount: chunks.length,
    metadata: syncMetadata(input, jobId, {
      extractionMethod: "manual_text",
    }),
  });
  const sourceDocument = await createSourceDocument(client, input.workspaceId, {
    sourceId: source.id,
    sourceVersionId: sourceVersion.id,
    title: source.name,
    mimeType: "text/plain",
    status: "ready",
    contentHash,
    byteSize: Buffer.byteLength(manualText, "utf8"),
    metadata: {
      extractionMethod: "manual_text",
    },
  });

  for (const chunk of chunks) {
    await createSourceChunk(client, input.workspaceId, {
      sourceId: source.id,
      sourceDocumentId: sourceDocument.id,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      contentHash: chunk.contentHash,
      tokenCount: chunk.tokenCount,
      metadata: {
        sourceType: "manual_text",
      },
    });
  }

  await updateSourceSyncState(client, input.workspaceId, source.id, {
    syncStatus: "synced",
    contentHash,
    lastSyncedAt: new Date().toISOString(),
    lastSyncError: null,
  });

  return {
    jobId,
    sourceId: source.id,
    status: "changed",
    contentHash,
    previousContentHash: source.contentHash,
    versionNumber: sourceVersion.versionNumber,
    documentCount: 1,
    chunkCount: chunks.length,
  };
}

async function getUnchangedVersion(
  client: RadarRepositoryClient,
  workspaceId: string,
  sourceId: string,
  contentHash: string,
  force = false,
) {
  if (force) {
    return null;
  }

  return getSourceVersionByContentHash(client, workspaceId, sourceId, contentHash);
}

async function markSourceUnchanged(
  client: RadarRepositoryClient,
  workspaceId: string,
  sourceId: string,
  contentHash: string,
) {
  await updateSourceSyncState(client, workspaceId, sourceId, {
    syncStatus: "synced",
    contentHash,
    lastSyncedAt: new Date().toISOString(),
    lastSyncError: null,
  });
}

function syncMetadata(input: SourceSyncJobInput, jobId: string, metadata: JsonRecord = {}) {
  return {
    ...metadata,
    syncJobId: jobId,
    syncReason: input.reason,
    requestedByUserId: input.requestedByUserId,
  };
}

function isSyncableSourceType(type: string): type is SyncableSourceType {
  return type === "url" || type === "manual_text";
}

function skippedReasonForSourceType(type: string) {
  const reasons: Record<string, string> = {
    uploaded_document: "uploaded_document_resync_requires_file_payload",
    api_endpoint: "api_endpoint_sync_waits_for_integration_runner",
    support_bot_endpoint: "support_bot_endpoint_sync_waits_for_knowledge_runner",
  };

  return reasons[type] ?? "source_type_not_syncable";
}

function syncErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Source sync failed.";
}

export class SourceSyncJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SourceSyncJobError";
  }
}
