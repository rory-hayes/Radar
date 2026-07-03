import "server-only";

import {
  createSourceChunk,
  createSourceDocument,
  createSourceVersion,
  getNextSourceVersionNumber,
  updateSourceSyncState,
  type RadarRepositoryClient,
} from "@/lib/repositories";
import { hashText, type UrlCrawlPage, type UrlCrawlResult } from "@/lib/sources/url-crawler";

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
  const chunks = result.pages.flatMap((page) => chunkPageText(page, maxChunkCharacters));
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
    const pageChunks = chunkPageText(page, maxChunkCharacters);

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
          pageChunkIndex: chunk.pageChunkIndex,
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

function chunkPageText(page: UrlCrawlPage, maxChunkCharacters: number) {
  const paragraphs = page.text.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;

    if (next.length <= maxChunkCharacters) {
      current = next;
      continue;
    }

    if (current) {
      chunks.push(current);
    }

    if (paragraph.length > maxChunkCharacters) {
      chunks.push(...splitLongParagraph(paragraph, maxChunkCharacters));
      current = "";
    } else {
      current = paragraph;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.map((content, pageChunkIndex) => ({
    content,
    contentHash: hashText(content),
    tokenCount: estimateTokenCount(content),
    pageChunkIndex,
  }));
}

function splitLongParagraph(paragraph: string, maxChunkCharacters: number) {
  const chunks: string[] = [];

  for (let index = 0; index < paragraph.length; index += maxChunkCharacters) {
    chunks.push(paragraph.slice(index, index + maxChunkCharacters));
  }

  return chunks;
}

function estimateTokenCount(content: string) {
  return Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length * 1.3));
}
