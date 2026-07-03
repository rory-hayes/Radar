import "server-only";

import {
  createSourceChunk,
  createSourceDocument,
  createSourceVersion,
  getNextSourceVersionNumber,
  updateSourceSyncState,
  type RadarRepositoryClient,
} from "@/lib/repositories";
import { chunkSourceText } from "@/lib/sources/text-chunking";
import { type UrlCrawlResult } from "@/lib/sources/url-crawler";

type PersistUrlCrawlOptions = {
  maxChunkCharacters?: number;
};

export async function persistUrlCrawlResult(
  client: RadarRepositoryClient,
  workspaceId: string,
  sourceId: string,
  result: UrlCrawlResult,
  options: PersistUrlCrawlOptions = {},
) {
  const maxChunkCharacters = options.maxChunkCharacters ?? 4000;
  const chunks = result.pages.flatMap((page) => chunkSourceText(page.text, maxChunkCharacters));
  const versionNumber = await getNextSourceVersionNumber(client, workspaceId, sourceId);
  const sourceVersion = await createSourceVersion(client, workspaceId, {
    sourceId,
    versionNumber,
    syncStatus: "synced",
    contentHash: result.contentHash,
    documentCount: result.pages.length,
    chunkCount: chunks.length,
    metadata: {
      requestedUrl: result.requestedUrl,
      crawlMode: result.mode,
      skippedUrlCount: result.metadata.skippedUrls.length,
      robotsChecked: result.metadata.robotsChecked,
      limits: result.metadata.limits,
    },
  });

  let chunkCursor = 0;

  for (const page of result.pages) {
    const sourceDocument = await createSourceDocument(client, workspaceId, {
      sourceId,
      sourceVersionId: sourceVersion.id,
      title: page.title ?? page.finalUrl,
      documentUri: page.finalUrl,
      mimeType: page.contentType,
      status: "ready",
      contentHash: page.contentHash,
      byteSize: page.byteSize,
      metadata: {
        description: page.description,
        canonicalUrl: page.metadata.canonicalUrl,
        fetchedAt: page.metadata.fetchedAt,
      },
    });
    const pageChunks = chunkSourceText(page.text, maxChunkCharacters);

    for (const chunk of pageChunks) {
      await createSourceChunk(client, workspaceId, {
        sourceId,
        sourceDocumentId: sourceDocument.id,
        chunkIndex: chunkCursor,
        content: chunk.content,
        contentHash: chunk.contentHash,
        tokenCount: chunk.tokenCount,
        metadata: {
          sourceUrl: page.finalUrl,
          pageChunkIndex: chunk.chunkIndex,
        },
      });
      chunkCursor += 1;
    }
  }

  await updateSourceSyncState(client, workspaceId, sourceId, {
    syncStatus: "synced",
    contentHash: result.contentHash,
    lastSyncedAt: new Date().toISOString(),
  });

  return {
    sourceVersion,
    documentCount: result.pages.length,
    chunkCount: chunkCursor,
  };
}
