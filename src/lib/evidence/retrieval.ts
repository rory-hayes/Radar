import "server-only";

import {
  getAssertionById,
  getTestCaseById,
  listAssertionSourcesForAssertion,
  matchAssertionSourceChunks,
  type RadarEvidenceChunkMatch,
  type RadarRepositoryClient,
} from "@/lib/repositories";
import {
  assertEmbeddingDimensions,
  createOpenAIEmbeddingProvider,
  type EmbeddingProvider,
} from "@/lib/embeddings/openai";

export type EvidenceRetrievalInput = {
  workspaceId: string;
  assertionId: string;
  testCaseId?: string;
  query: string;
  sourceIds?: readonly string[];
  limit?: number;
};

export type EvidenceRetrievalOptions = {
  provider?: EmbeddingProvider;
};

export type EvidenceRetrievalResult = {
  assertionId: string;
  testCaseId?: string;
  query: string;
  matches: EvidenceRetrievalMatch[];
};

export type EvidenceRetrievalMatch = {
  rank: number;
  score: number;
  excerpt: string;
  citation: {
    sourceId: string;
    sourceName: string;
    sourceType: string;
    sourceDocumentId: string;
    documentTitle: string;
    documentUri?: string;
    storagePath?: string;
    chunkId: string;
    chunkIndex: number;
    contentHash: string;
  };
};

export async function retrieveEvidenceForAssertion(
  client: RadarRepositoryClient,
  input: EvidenceRetrievalInput,
  options: EvidenceRetrievalOptions = {},
): Promise<EvidenceRetrievalResult> {
  const assertion = await getAssertionById(client, input.workspaceId, input.assertionId);

  if (!assertion) {
    throw new EvidenceRetrievalError("Assertion was not found in this workspace.");
  }

  const testCase = input.testCaseId
    ? await getTestCaseById(client, input.workspaceId, input.testCaseId)
    : null;

  if (input.testCaseId && (!testCase || testCase.assertionId !== input.assertionId)) {
    throw new EvidenceRetrievalError("Test case was not found for this assertion.");
  }

  const assertionSources = await listAssertionSourcesForAssertion(client, input.workspaceId, input.assertionId);
  const allowedSourceIds = new Set(assertionSources.map((source) => source.sourceId));

  if (allowedSourceIds.size === 0) {
    return {
      assertionId: input.assertionId,
      testCaseId: input.testCaseId,
      query: input.query,
      matches: [],
    };
  }

  const requestedSourceIds = input.sourceIds?.length ? input.sourceIds : [...allowedSourceIds];

  for (const sourceId of requestedSourceIds) {
    if (!allowedSourceIds.has(sourceId)) {
      throw new EvidenceRetrievalError("Requested source is not linked to this assertion.");
    }
  }

  const provider = options.provider ?? createOpenAIEmbeddingProvider();
  const retrievalText = buildRetrievalText(input.query, assertion, testCase);
  const [queryEmbedding] = await provider.embedTexts([retrievalText]);

  assertEmbeddingDimensions(queryEmbedding, provider.dimensions);

  const matches = await matchAssertionSourceChunks(client, input.workspaceId, {
    assertionId: input.assertionId,
    queryEmbedding,
    sourceIds: requestedSourceIds,
    limit: input.limit ?? 8,
  });

  return {
    assertionId: input.assertionId,
    testCaseId: input.testCaseId,
    query: input.query,
    matches: matches.map(mapEvidenceMatch),
  };
}

function buildRetrievalText(
  query: string,
  assertion: NonNullable<Awaited<ReturnType<typeof getAssertionById>>>,
  testCase: Awaited<ReturnType<typeof getTestCaseById>>,
) {
  return [
    `Question: ${query}`,
    `Assertion: ${assertion.title}`,
    `Expected behavior: ${assertion.expectedBehavior}`,
    testCase ? `Test case: ${testCase.title}\nExpected result: ${testCase.expectedResult}` : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function mapEvidenceMatch(match: RadarEvidenceChunkMatch, index: number): EvidenceRetrievalMatch {
  return {
    rank: index + 1,
    score: clampScore(match.similarity),
    excerpt: boundedExcerpt(match.content),
    citation: {
      sourceId: match.sourceId,
      sourceName: match.sourceName,
      sourceType: match.sourceType,
      sourceDocumentId: match.sourceDocumentId,
      documentTitle: match.documentTitle,
      documentUri: match.documentUri,
      storagePath: match.storagePath,
      chunkId: match.chunkId,
      chunkIndex: match.chunkIndex,
      contentHash: match.contentHash,
    },
  };
}

function boundedExcerpt(content: string) {
  return content.length <= 2000 ? content : `${content.slice(0, 1997)}...`;
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

export class EvidenceRetrievalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceRetrievalError";
  }
}
