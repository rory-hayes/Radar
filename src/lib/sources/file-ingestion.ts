import "server-only";

import {
  createSourceChunk,
  createSourceDocument,
  createSourceVersion,
  getNextSourceVersionNumber,
  updateSourceSyncState,
  type RadarRepositoryClient,
} from "@/lib/repositories";
import { extractUploadedDocument } from "@/lib/sources/file-extraction";
import { chunkSourceText } from "@/lib/sources/text-chunking";
import { uploadEvidenceArtifact } from "@/lib/storage";

type PersistUploadedDocumentOptions = {
  maxChunkCharacters?: number;
};

export async function persistUploadedDocumentSource(
  client: RadarRepositoryClient,
  workspaceId: string,
  sourceId: string,
  file: File,
  options: PersistUploadedDocumentOptions = {},
) {
  try {
    const extracted = await extractUploadedDocument(file);
    const storageFileName = `${sourceId}-${extracted.contentHash.slice(0, 12)}-${extracted.fileName}`;
    const artifact = await uploadEvidenceArtifact(
      client,
      {
        workspaceId,
        artifactKind: "uploaded-document",
        ownerId: sourceId,
        fileName: storageFileName,
      },
      file,
      {
        contentType: extracted.mimeType,
        upsert: false,
      },
    );
    const chunks = chunkSourceText(extracted.text, options.maxChunkCharacters ?? 4000);
    const versionNumber = await getNextSourceVersionNumber(client, workspaceId, sourceId);
    const sourceVersion = await createSourceVersion(client, workspaceId, {
      sourceId,
      versionNumber,
      syncStatus: "synced",
      contentHash: extracted.contentHash,
      documentCount: 1,
      chunkCount: chunks.length,
      metadata: {
        uploadedFileName: extracted.fileName,
        extractionMethod: extracted.metadata.extractionMethod,
        storagePath: artifact.storagePath,
      },
    });
    const sourceDocument = await createSourceDocument(client, workspaceId, {
      sourceId,
      sourceVersionId: sourceVersion.id,
      title: extracted.fileName,
      mimeType: extracted.mimeType,
      storagePath: artifact.storagePath,
      status: "ready",
      contentHash: extracted.contentHash,
      byteSize: extracted.byteSize,
      metadata: {
        extension: extracted.metadata.extension,
        extractionMethod: extracted.metadata.extractionMethod,
      },
    });

    for (const chunk of chunks) {
      await createSourceChunk(client, workspaceId, {
        sourceId,
        sourceDocumentId: sourceDocument.id,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        contentHash: chunk.contentHash,
        tokenCount: chunk.tokenCount,
        metadata: {
          storagePath: artifact.storagePath,
          uploadedFileName: extracted.fileName,
        },
      });
    }

    await updateSourceSyncState(client, workspaceId, sourceId, {
      syncStatus: "synced",
      contentHash: extracted.contentHash,
      lastSyncedAt: new Date().toISOString(),
    });

    return {
      sourceVersion,
      sourceDocument,
      storagePath: artifact.storagePath,
      chunkCount: chunks.length,
      contentHash: extracted.contentHash,
    };
  } catch (error) {
    await updateSourceSyncState(client, workspaceId, sourceId, {
      syncStatus: "error",
      lastSyncError: error instanceof Error ? error.message : "Uploaded document extraction failed.",
    });

    throw error;
  }
}
