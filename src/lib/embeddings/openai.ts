import "server-only";

import { z } from "zod";

import { serverEnv } from "@/lib/env/server";

export const defaultEmbeddingModel = "text-embedding-3-small";
export const defaultEmbeddingDimensions = 1536;

export type EmbeddingProvider = {
  model: string;
  dimensions: number;
  embedTexts(texts: readonly string[]): Promise<number[][]>;
};

type OpenAIEmbeddingProviderOptions = {
  apiKey?: string;
  model?: string;
  dimensions?: number;
  fetcher?: typeof fetch;
};

const openAIEmbeddingResponseSchema = z.object({
  data: z.array(
    z.object({
      index: z.number().int().min(0),
      embedding: z.array(z.number()),
    }),
  ),
  usage: z
    .object({
      prompt_tokens: z.number().int().min(0).optional(),
      total_tokens: z.number().int().min(0).optional(),
    })
    .optional(),
});

export function createOpenAIEmbeddingProvider(options: OpenAIEmbeddingProviderOptions = {}): EmbeddingProvider {
  const apiKey = options.apiKey ?? serverEnv.OPENAI_API_KEY;
  const model = options.model ?? defaultEmbeddingModel;
  const dimensions = options.dimensions ?? defaultEmbeddingDimensions;
  const fetcher = options.fetcher ?? fetch;

  if (!apiKey) {
    throw new OpenAIEmbeddingError("OpenAI embeddings are not configured.");
  }

  return {
    model,
    dimensions,
    async embedTexts(texts) {
      const cleanTexts = texts.map((text) => text.trim());

      if (cleanTexts.length === 0 || cleanTexts.some((text) => text.length === 0)) {
        throw new OpenAIEmbeddingError("Embedding input cannot be empty.");
      }

      const response = await fetcher("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: cleanTexts,
          encoding_format: "float",
        }),
      });

      if (!response.ok) {
        throw new OpenAIEmbeddingError(`OpenAI embedding request failed with status ${response.status}.`);
      }

      const payload = openAIEmbeddingResponseSchema.parse(await response.json());
      const embeddings = [...payload.data]
        .sort((first, second) => first.index - second.index)
        .map((item) => item.embedding);

      if (embeddings.length !== cleanTexts.length) {
        throw new OpenAIEmbeddingError("OpenAI embedding response did not match the requested input count.");
      }

      for (const embedding of embeddings) {
        assertEmbeddingDimensions(embedding, dimensions);
      }

      return embeddings;
    },
  };
}

export function assertEmbeddingDimensions(embedding: readonly number[], dimensions = defaultEmbeddingDimensions) {
  if (embedding.length !== dimensions) {
    throw new OpenAIEmbeddingError(`Expected ${dimensions} embedding dimensions but received ${embedding.length}.`);
  }

  for (const value of embedding) {
    if (!Number.isFinite(value)) {
      throw new OpenAIEmbeddingError("Embedding contains a non-finite value.");
    }
  }
}

export class OpenAIEmbeddingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAIEmbeddingError";
  }
}
