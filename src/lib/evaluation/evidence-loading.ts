import "server-only";

import {
  getAssertionById,
  getTestCaseById,
  listAssertionSourcesForAssertion,
  listSourceDocuments,
  listSourceVersions,
  type RadarAssertionSource,
  type RadarRepositoryClient,
  type RadarSourceDocumentDetail,
  type RadarSourceVersionDetail,
} from "@/lib/repositories";
import {
  retrieveEvidenceForAssertion,
  type EvidenceRetrievalMatch,
} from "@/lib/evidence/retrieval";
import { type EmbeddingProvider } from "@/lib/embeddings/openai";
import { type EvaluationEvidenceRefInput } from "@/lib/evaluation/schema";

export type EvaluationEvidenceLoadInput = {
  workspaceId: string;
  assertionId: string;
  testCaseId: string;
  query?: string;
  sourceIds?: readonly string[];
  matchLimit?: number;
  snapshotDocumentLimit?: number;
};

export type EvaluationEvidenceLoadOptions = {
  provider?: EmbeddingProvider;
};

export type EvaluationEvidenceContext = {
  assertionId: string;
  testCaseId: string;
  query: string;
  matches: EvidenceRetrievalMatch[];
  evidenceRefs: EvaluationEvidenceRefInput[];
  sourceSnapshots: EvaluationSourceSnapshot[];
};

export type EvaluationSourceSnapshot = {
  sourceId: string;
  isRequired: boolean;
  relationshipType: RadarAssertionSource["relationshipType"];
  purpose?: string;
  latestVersion?: Pick<
    RadarSourceVersionDetail,
    "id" | "versionNumber" | "syncStatus" | "contentHash" | "documentCount" | "chunkCount" | "createdAt"
  >;
  documents: Array<
    Pick<
      RadarSourceDocumentDetail,
      "id" | "title" | "documentUri" | "mimeType" | "storagePath" | "status" | "contentHash" | "createdAt"
    >
  >;
};

export async function loadEvaluationEvidence(
  client: RadarRepositoryClient,
  input: EvaluationEvidenceLoadInput,
  options: EvaluationEvidenceLoadOptions = {},
): Promise<EvaluationEvidenceContext> {
  const assertion = await getAssertionById(client, input.workspaceId, input.assertionId);

  if (!assertion) {
    throw new EvaluationEvidenceLoadingError("Assertion was not found in this workspace.");
  }

  const testCase = await getTestCaseById(client, input.workspaceId, input.testCaseId);

  if (!testCase || testCase.assertionId !== assertion.id) {
    throw new EvaluationEvidenceLoadingError("Test case was not found for this assertion.");
  }

  const sourceLinks = await listAssertionSourcesForAssertion(client, input.workspaceId, assertion.id);
  const selectedSourceIds = selectLinkedSourceIds(sourceLinks, input.sourceIds);
  const query = input.query?.trim() || buildEvaluationEvidenceQuery(assertion, testCase);
  const [retrieval, sourceSnapshots] = await Promise.all([
    retrieveEvidenceForAssertion(
      client,
      {
        workspaceId: input.workspaceId,
        assertionId: assertion.id,
        testCaseId: testCase.id,
        query,
        sourceIds: selectedSourceIds,
        limit: input.matchLimit ?? 8,
      },
      { provider: options.provider },
    ),
    loadSourceSnapshots(client, input.workspaceId, sourceLinks, selectedSourceIds, {
      documentLimit: input.snapshotDocumentLimit ?? 5,
    }),
  ]);

  return {
    assertionId: assertion.id,
    testCaseId: testCase.id,
    query,
    matches: retrieval.matches,
    evidenceRefs: retrieval.matches.map(matchToEvidenceRef),
    sourceSnapshots,
  };
}

export function buildEvaluationEvidenceQuery(
  assertion: NonNullable<Awaited<ReturnType<typeof getAssertionById>>>,
  testCase: NonNullable<Awaited<ReturnType<typeof getTestCaseById>>>,
) {
  const inputText = typeof testCase.input.text === "string" ? testCase.input.text : JSON.stringify(testCase.input);

  return [
    `Assertion: ${assertion.title}`,
    `Expected behavior: ${assertion.expectedBehavior}`,
    `Test case: ${testCase.title}`,
    `Input: ${inputText}`,
    `Expected result: ${testCase.expectedResult}`,
  ].join("\n\n");
}

function selectLinkedSourceIds(
  sourceLinks: readonly RadarAssertionSource[],
  requestedSourceIds: readonly string[] | undefined,
) {
  const linkedSourceIds = new Set(sourceLinks.map((source) => source.sourceId));

  if (linkedSourceIds.size === 0) {
    return [];
  }

  if (!requestedSourceIds?.length) {
    return [...linkedSourceIds];
  }

  for (const sourceId of requestedSourceIds) {
    if (!linkedSourceIds.has(sourceId)) {
      throw new EvaluationEvidenceLoadingError("Requested source is not linked to this assertion.");
    }
  }

  return [...requestedSourceIds];
}

async function loadSourceSnapshots(
  client: RadarRepositoryClient,
  workspaceId: string,
  sourceLinks: readonly RadarAssertionSource[],
  sourceIds: readonly string[],
  options: { documentLimit: number },
) {
  const linksBySourceId = new Map(sourceLinks.map((link) => [link.sourceId, link]));

  return Promise.all(
    sourceIds.map(async (sourceId) => {
      const link = linksBySourceId.get(sourceId);
      const [versions, documents] = await Promise.all([
        listSourceVersions(client, workspaceId, sourceId, { limit: 1 }),
        listSourceDocuments(client, workspaceId, sourceId, { limit: options.documentLimit }),
      ]);
      const latestVersion = versions[0];

      return {
        sourceId,
        isRequired: link?.isRequired ?? false,
        relationshipType: link?.relationshipType ?? "manual",
        purpose: link?.purpose,
        latestVersion: latestVersion
          ? {
              id: latestVersion.id,
              versionNumber: latestVersion.versionNumber,
              syncStatus: latestVersion.syncStatus,
              contentHash: latestVersion.contentHash,
              documentCount: latestVersion.documentCount,
              chunkCount: latestVersion.chunkCount,
              createdAt: latestVersion.createdAt,
            }
          : undefined,
        documents: documents.map((document) => ({
          id: document.id,
          title: document.title,
          documentUri: document.documentUri,
          mimeType: document.mimeType,
          storagePath: document.storagePath,
          status: document.status,
          contentHash: document.contentHash,
          createdAt: document.createdAt,
        })),
      } satisfies EvaluationSourceSnapshot;
    }),
  );
}

function matchToEvidenceRef(match: EvidenceRetrievalMatch): EvaluationEvidenceRefInput {
  return {
    sourceId: match.citation.sourceId,
    sourceDocumentId: match.citation.sourceDocumentId,
    sourceChunkId: match.citation.chunkId,
    storagePath: match.citation.storagePath,
    citation: `${match.citation.documentTitle}#chunk-${match.citation.chunkIndex}`,
    score: match.score,
  };
}

export class EvaluationEvidenceLoadingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvaluationEvidenceLoadingError";
  }
}
