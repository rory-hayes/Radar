import "server-only";

import { randomUUID } from "node:crypto";

import {
  listSourceChunksNeedingEmbedding,
  updateSourceChunkEmbedding,
  type RadarRepositoryClient,
  type RadarSourceChunkForEmbedding,
} from "@/lib/repositories";
import {
  assertEmbeddingDimensions,
  createOpenAIEmbeddingProvider,
  defaultEmbeddingDimensions,
  type EmbeddingProvider,
} from "@/lib/embeddings/openai";

export const sourceEmbeddingReasons = ["source_synced", "manual", "repair"] as const;

export type SourceEmbeddingReason = (typeof sourceEmbeddingReasons)[number];

export type SourceEmbeddingJobInput = {
  workspaceId: string;
  sourceId: string;
  reason: SourceEmbeddingReason;
};

export type SourceEmbeddingJobOptions = {
  jobId?: string;
  limit?: number;
  batchSize?: number;
  provider?: EmbeddingProvider;
};

export type SourceEmbeddingJobResult = {
  jobId: string;
  sourceId: string;
  status: "embedded" | "up_to_date" | "error";
  embeddedCount: number;
  remainingCount: number;
  model?: string;
  dimensions?: number;
  reason?: string;
};

export async function runSourceEmbeddingJob(
  client: RadarRepositoryClient,
  input: SourceEmbeddingJobInput,
  options: SourceEmbeddingJobOptions = {},
): Promise<SourceEmbeddingJobResult> {
  const jobId = options.jobId ?? randomUUID();
  const limit = options.limit ?? 100;
  const batchSize = Math.min(Math.max(options.batchSize ?? 32, 1), 64);
  const chunks = await listSourceChunksNeedingEmbedding(client, input.workspaceId, input.sourceId, { limit });

  if (chunks.length === 0) {
    return {
      jobId,
      sourceId: input.sourceId,
      status: "up_to_date",
      embeddedCount: 0,
      remainingCount: 0,
      model: options.provider?.model,
      dimensions: options.provider?.dimensions,
    };
  }

  const provider = options.provider ?? createOpenAIEmbeddingProvider();

  try {
    let embeddedCount = 0;

    for (let index = 0; index < chunks.length; index += batchSize) {
      const batch = chunks.slice(index, index + batchSize);
      const embeddings = await provider.embedTexts(batch.map((chunk) => chunk.content));

      if (embeddings.length !== batch.length) {
        throw new SourceEmbeddingJobError("Embedding provider returned an unexpected number of vectors.");
      }

      for (const [chunkIndex, chunk] of batch.entries()) {
        const embedding = embeddings[chunkIndex];

        assertEmbeddingDimensions(embedding, provider.dimensions);
        await updateSourceChunkEmbedding(client, input.workspaceId, chunk.id, {
          embedding,
          metadata: embeddingMetadata(chunk, input, jobId, provider),
        });
        embeddedCount += 1;
      }
    }

    return {
      jobId,
      sourceId: input.sourceId,
      status: "embedded",
      embeddedCount,
      remainingCount: Math.max(0, chunks.length - embeddedCount),
      model: provider.model,
      dimensions: provider.dimensions,
    };
  } catch (error) {
    return {
      jobId,
      sourceId: input.sourceId,
      status: "error",
      embeddedCount: 0,
      remainingCount: chunks.length,
      model: provider.model,
      dimensions: provider.dimensions,
      reason: error instanceof Error ? error.message : "Source embedding failed.",
    };
  }
}

function embeddingMetadata(
  chunk: RadarSourceChunkForEmbedding,
  input: SourceEmbeddingJobInput,
  jobId: string,
  provider: EmbeddingProvider,
) {
  return {
    ...chunk.metadata,
    embedding: {
      model: provider.model,
      dimensions: provider.dimensions ?? defaultEmbeddingDimensions,
      embeddedAt: new Date().toISOString(),
      embeddingJobId: jobId,
      embeddingReason: input.reason,
      contentHash: chunk.contentHash,
    },
  };
}

export class SourceEmbeddingJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SourceEmbeddingJobError";
  }
}
