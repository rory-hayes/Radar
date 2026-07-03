import "server-only";

import {
  createTestCaseResult,
  getAssertionById,
  listTestCasesForAssertion,
  type JsonRecord,
  type RadarEvaluationRunJob,
  type RadarRepositoryClient,
} from "@/lib/repositories";
import { type RadarAssertion, type RadarTestCase } from "@/lib/assertions/schema";
import {
  type EvaluationEvidenceRefInput,
  type TestCaseResultStatus,
} from "@/lib/evaluation/schema";
import {
  loadEvaluationEvidence,
  type EvaluationEvidenceContext,
  type EvaluationEvidenceLoadOptions,
} from "@/lib/evaluation/evidence-loading";
import {
  runNextEvaluationJob,
  type EvaluationJobOptions,
  type EvaluationJobRunnerResult,
  type RunNextEvaluationJobInput,
} from "@/lib/evaluation/job-orchestration";
import {
  evaluateKnowledgeAnswer,
  type HybridEvaluationResult,
  type HybridEvaluatorJudgeProvider,
  type HybridRubricEvidenceSnippet,
} from "@/lib/evaluation/hybrid-rubric";
import {
  filterManualRerunTestCases,
  readManualRerunRequest,
} from "@/lib/evaluation/manual-reruns";
import {
  loadKnowledgeTargetConfigurationsForAssertion,
  type KnowledgeTargetConfiguration,
} from "@/lib/evaluation/knowledge-targets";

export const knowledgeRunnerVersion = "rad-055";

export type KnowledgeRunnerTargetRequest = {
  workspaceId: string;
  assertion: RadarAssertion;
  testCase: RadarTestCase;
  question: string;
  target: KnowledgeTargetConfiguration;
  evidence: EvaluationEvidenceContext;
};

export type KnowledgeRunnerTargetResponse = {
  answer: string;
  statusCode?: number;
  contentType?: string;
  capturedAt: string;
  metadata?: JsonRecord;
};

export type KnowledgeRunnerTargetClient = (
  request: KnowledgeRunnerTargetRequest,
) => Promise<KnowledgeRunnerTargetResponse>;

export type KnowledgeRunnerOptions = EvaluationEvidenceLoadOptions & {
  targetClient?: KnowledgeRunnerTargetClient;
  judgeProvider?: HybridEvaluatorJudgeProvider;
  now?: () => Date;
};

export async function runNextKnowledgeEvaluationJob(
  client: RadarRepositoryClient,
  input: RunNextEvaluationJobInput,
  options: EvaluationJobOptions & KnowledgeRunnerOptions = {},
) {
  return runNextEvaluationJob(
    client,
    input,
    (context) => runKnowledgeEvaluationJob(client, context.run, options),
    options,
  );
}

export async function runKnowledgeEvaluationJob(
  client: RadarRepositoryClient,
  run: RadarEvaluationRunJob,
  options: KnowledgeRunnerOptions = {},
): Promise<EvaluationJobRunnerResult> {
  const startedAt = options.now?.() ?? new Date();

  if (run.runnerType !== "knowledge") {
    throw new KnowledgeRunnerExecutionError("Knowledge runner received a non-knowledge evaluation run.");
  }

  const assertion = await getAssertionById(client, run.workspaceId, run.assertionId);

  if (!assertion) {
    throw new KnowledgeRunnerExecutionError("Assertion was not found in this workspace.");
  }

  const allTestCases = await listTestCasesForAssertion(client, run.workspaceId, assertion.id);
  const approvedKnowledgeTestCases = allTestCases.filter(
    (testCase) => testCase.status === "approved" && testCase.type === "customer_question",
  );
  const manualRerun = readManualRerunRequest(run.executionMetadata);
  const testCases = filterManualRerunTestCases(approvedKnowledgeTestCases, manualRerun);

  if (testCases.length === 0) {
    const isTargetedRerun = manualRerun?.scope === "test_case";

    return {
      status: "error",
      totalTestCases: 0,
      errorCount: 1,
      executionMetadata: knowledgeRunnerMetadata({
        state: "error",
        reason: isTargetedRerun
          ? "manual_rerun_test_case_not_runnable"
          : "no_approved_customer_question_test_cases",
        manualRerun,
      }),
      errorMessage: isTargetedRerun
        ? "The targeted manual rerun test case is no longer approved or runnable."
        : "Knowledge Runner needs at least one approved customer-question test case.",
    };
  }

  const targetConfiguration = await loadKnowledgeTargetConfigurationsForAssertion(client, {
    workspaceId: run.workspaceId,
    assertionId: assertion.id,
  });
  const target = selectKnowledgeRunnerTarget(targetConfiguration.targets);

  if (!target) {
    return {
      status: "error",
      totalTestCases: testCases.length,
      errorCount: testCases.length,
      executionMetadata: knowledgeRunnerMetadata({
        state: "error",
        reason: "no_ready_knowledge_target",
        targetCount: targetConfiguration.targets.length,
        manualRerun,
      }),
      errorMessage: "Knowledge Runner needs a ready target endpoint or answer set.",
    };
  }

  const targetClient = options.targetClient ?? defaultKnowledgeTargetClient;
  const resultRecords = await Promise.all(
    testCases.map((testCase) => executeKnowledgeTestCase(client, run, assertion, testCase, target, targetClient, options)),
  );
  const resultSummary = summarizeKnowledgeResultRecords(resultRecords);
  const completedAt = options.now?.() ?? new Date();
  const evidenceRefs = dedupeEvidenceRefs(resultRecords.flatMap((result) => result.evidenceRefs));

  return {
    status: resultSummary.status,
    totalTestCases: testCases.length,
    passedCount: resultSummary.passedCount,
    warningCount: resultSummary.warningCount,
    failedCount: resultSummary.failedCount,
    errorCount: resultSummary.errorCount,
    skippedCount: resultSummary.skippedCount,
    score: resultSummary.score,
    confidence: resultSummary.confidence,
    evidenceRefs,
    executionMetadata: knowledgeRunnerMetadata({
      state: "scored_outputs_persisted",
      targetSourceId: target.sourceId,
      targetKind: target.kind,
      targetSourceType: target.sourceType,
      manualRerun,
      testCaseResults: resultRecords.length,
      averageScore: resultSummary.score,
      averageConfidence: resultSummary.confidence,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
    }),
  };
}

export function selectKnowledgeRunnerTarget(
  targets: readonly KnowledgeTargetConfiguration[],
): KnowledgeTargetConfiguration | null {
  const readyTargets = targets.filter((target) => target.isReady);

  return (
    readyTargets.find((target) => target.kind === "ai_support_endpoint") ??
    readyTargets.find((target) => target.kind === "http_endpoint") ??
    readyTargets.find((target) => target.kind === "uploaded_answer_set") ??
    readyTargets.find((target) => target.kind === "manual_answer_set") ??
    null
  );
}

async function executeKnowledgeTestCase(
  client: RadarRepositoryClient,
  run: RadarEvaluationRunJob,
  assertion: RadarAssertion,
  testCase: RadarTestCase,
  target: KnowledgeTargetConfiguration,
  targetClient: KnowledgeRunnerTargetClient,
  options: KnowledgeRunnerOptions,
) {
  const startedAt = options.now?.() ?? new Date();
  const question = questionFromTestCase(testCase);

  try {
    const evidence = await loadEvaluationEvidence(
      client,
      {
        workspaceId: run.workspaceId,
        assertionId: assertion.id,
        testCaseId: testCase.id,
        query: question,
      },
      { provider: options.provider },
    );
    const response = await targetClient({
      workspaceId: run.workspaceId,
      assertion,
      testCase,
      question,
      target,
      evidence,
    });
    const completedAt = options.now?.() ?? new Date();
    const evidenceRefs = evidence.evidenceRefs;
    const actualOutput = actualOutputForResponse(question, target, response, evidence);
    const evaluation = await evaluateKnowledgeAnswer(
      {
        assertion,
        testCase,
        actualOutput,
        evidence: evidenceSnippets(evidence),
        evidenceRefCount: evidenceRefs.length,
      },
      { judgeProvider: options.judgeProvider },
    );

    return createTestCaseResult(client, run.workspaceId, {
      evaluationRunId: run.id,
      assertionId: assertion.id,
      testCaseId: testCase.id,
      runnerType: "knowledge",
      status: evaluation.status,
      score: evaluation.score,
      confidence: evaluation.confidence,
      actualOutput,
      actualSummary: boundedText(response.answer, 2000),
      evaluatorSummary: boundedText(evaluation.summary, 2000),
      evidenceRefs,
      executionMetadata: testCaseExecutionMetadata(target, evidence, response, evaluation, {
        status: evaluation.status,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
      }),
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
    });
  } catch (error) {
    const completedAt = options.now?.() ?? new Date();

    return createTestCaseResult(client, run.workspaceId, {
      evaluationRunId: run.id,
      assertionId: assertion.id,
      testCaseId: testCase.id,
      runnerType: "knowledge",
      status: "error",
      actualOutput: actualOutputForError(question, target, error),
      evidenceRefs: [],
      executionMetadata: testCaseExecutionMetadata(target, null, null, null, {
        status: "error",
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
      }),
      errorMessage: errorMessage(error),
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
    });
  }
}

async function defaultKnowledgeTargetClient(
  request: KnowledgeRunnerTargetRequest,
): Promise<KnowledgeRunnerTargetResponse> {
  if (request.target.kind === "uploaded_answer_set" || request.target.kind === "manual_answer_set") {
    const answer = request.evidence.matches.map((match) => match.excerpt).join("\n\n---\n\n");

    if (!answer.trim()) {
      throw new KnowledgeRunnerExecutionError("Answer-set target did not return any matching answer content.");
    }

    return {
      answer: boundedText(answer, 8000),
      capturedAt: new Date().toISOString(),
      metadata: {
        source: "answer_set_evidence",
        matchCount: request.evidence.matches.length,
      },
    };
  }

  if (!request.target.targetUri) {
    throw new KnowledgeRunnerExecutionError("Endpoint target is missing a URL.");
  }

  if (request.target.authMode && request.target.authMode !== "none") {
    throw new KnowledgeRunnerExecutionError("Endpoint credential mode is configured but runner credentials are not available.");
  }

  const response = await fetchKnowledgeTarget(request.target, request.question, {
    workspaceId: request.workspaceId,
    assertionId: request.assertion.id,
    testCaseId: request.testCase.id,
  });
  const contentType = response.headers.get("content-type") ?? undefined;
  const text = await response.text();

  if (!response.ok) {
    throw new KnowledgeRunnerExecutionError(`Endpoint target returned HTTP ${response.status}.`);
  }

  return {
    answer: extractAnswerText(text),
    statusCode: response.status,
    contentType,
    capturedAt: new Date().toISOString(),
    metadata: {
      source: "endpoint",
    },
  };
}

async function fetchKnowledgeTarget(
  target: KnowledgeTargetConfiguration,
  question: string,
  context: {
    workspaceId: string;
    assertionId: string;
    testCaseId: string;
  },
) {
  const url = new URL(target.targetUri ?? "");
  const method = target.httpMethod ?? "GET";

  if (method === "GET") {
    url.searchParams.set("question", question);
    url.searchParams.set("assertionId", context.assertionId);
    url.searchParams.set("testCaseId", context.testCaseId);

    return fetch(url, {
      method,
      headers: {
        Accept: "application/json, text/plain;q=0.9",
      },
    });
  }

  return fetch(url, {
    method,
    headers: {
      Accept: "application/json, text/plain;q=0.9",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      workspaceId: context.workspaceId,
      assertionId: context.assertionId,
      testCaseId: context.testCaseId,
    }),
  });
}

function actualOutputForResponse(
  question: string,
  target: KnowledgeTargetConfiguration,
  response: KnowledgeRunnerTargetResponse,
  evidence: EvaluationEvidenceContext,
) {
  return {
    runner: "knowledge",
    runnerVersion: knowledgeRunnerVersion,
    question,
    target: serializableTarget(target),
    response: {
      answer: boundedText(response.answer, 8000),
      statusCode: response.statusCode,
      contentType: response.contentType,
      capturedAt: response.capturedAt,
      metadata: response.metadata ?? {},
    },
    evidence: {
      query: evidence.query,
      matchCount: evidence.matches.length,
      citations: evidence.evidenceRefs,
    },
  };
}

function actualOutputForError(question: string, target: KnowledgeTargetConfiguration, error: unknown) {
  return {
    runner: "knowledge",
    runnerVersion: knowledgeRunnerVersion,
    question,
    target: serializableTarget(target),
    error: {
      name: error instanceof Error ? error.name : "KnowledgeRunnerExecutionError",
      message: errorMessage(error),
    },
  };
}

function testCaseExecutionMetadata(
  target: KnowledgeTargetConfiguration,
  evidence: EvaluationEvidenceContext | null,
  response: KnowledgeRunnerTargetResponse | null,
  evaluation: HybridEvaluationResult | null,
  input: {
    status: TestCaseResultStatus;
    startedAt: string;
    completedAt: string;
  },
) {
  return knowledgeRunnerMetadata({
    state: "test_case_raw_output",
    status: input.status,
    targetSourceId: target.sourceId,
    targetKind: target.kind,
    evidenceMatchCount: evidence?.matches.length ?? 0,
    targetStatusCode: response?.statusCode,
    rubricVersion: evaluation?.rubricVersion,
    score: evaluation?.score,
    confidence: evaluation?.confidence,
    recommendedFinding: evaluation?.recommendedFinding,
    dimensionScores: evaluation?.dimensions.map((dimension) => ({
      id: dimension.id,
      score: dimension.score,
      weight: dimension.weight,
    })),
    startedAt: input.startedAt,
    completedAt: input.completedAt,
  });
}

function serializableTarget(target: KnowledgeTargetConfiguration) {
  return {
    sourceId: target.sourceId,
    kind: target.kind,
    sourceType: target.sourceType,
    httpMethod: target.httpMethod,
    authMode: target.authMode,
    targetUri: target.targetUri,
    syncStatus: target.syncStatus,
  };
}

function dedupeEvidenceRefs(evidenceRefs: readonly EvaluationEvidenceRefInput[]) {
  const seen = new Set<string>();

  return evidenceRefs.filter((ref) => {
    const key = [ref.sourceId, ref.sourceDocumentId, ref.sourceChunkId, ref.storagePath, ref.citation].join(":");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function evidenceSnippets(evidence: EvaluationEvidenceContext): HybridRubricEvidenceSnippet[] {
  return evidence.matches.map((match) => ({
    excerpt: match.excerpt,
    citation: `${match.citation.documentTitle}#chunk-${match.citation.chunkIndex}`,
    score: match.score,
  }));
}

function summarizeKnowledgeResultRecords(
  results: Awaited<ReturnType<typeof createTestCaseResult>>[],
): EvaluationJobRunnerResult & {
  passedCount: number;
  warningCount: number;
  failedCount: number;
  errorCount: number;
  skippedCount: number;
} {
  const passedCount = results.filter((result) => result.status === "passed").length;
  const warningCount = results.filter((result) => result.status === "warning").length;
  const failedCount = results.filter((result) => result.status === "failed").length;
  const errorCount = results.filter((result) => result.status === "error").length;
  const skippedCount = results.filter((result) => result.status === "skipped").length;
  const scoredResults = results.filter((result) => typeof result.score === "number");
  const confidentResults = results.filter((result) => typeof result.confidence === "number");
  const status = aggregateKnowledgeRunStatus({
    totalCount: results.length,
    passedCount,
    warningCount,
    failedCount,
    errorCount,
    skippedCount,
  });

  return {
    status,
    passedCount,
    warningCount,
    failedCount,
    errorCount,
    skippedCount,
    score: averageScore(scoredResults.map((result) => result.score)),
    confidence: averageScore(confidentResults.map((result) => result.confidence)),
  };
}

function aggregateKnowledgeRunStatus(input: {
  totalCount: number;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  errorCount: number;
  skippedCount: number;
}): EvaluationJobRunnerResult["status"] {
  if (input.errorCount >= input.totalCount) {
    return "error";
  }

  if (input.failedCount > 0) {
    return "failed";
  }

  if (input.warningCount > 0 || input.errorCount > 0) {
    return "warning";
  }

  if (input.passedCount === input.totalCount) {
    return "passed";
  }

  return "inconclusive";
}

function averageScore(values: Array<number | undefined>) {
  const numericValues = values.filter((value): value is number => typeof value === "number");

  if (numericValues.length === 0) {
    return undefined;
  }

  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}

function questionFromTestCase(testCase: RadarTestCase) {
  if (typeof testCase.input.text === "string" && testCase.input.text.trim()) {
    return testCase.input.text.trim();
  }

  if (typeof testCase.input.question === "string" && testCase.input.question.trim()) {
    return testCase.input.question.trim();
  }

  if (typeof testCase.input.scenario === "string" && testCase.input.scenario.trim()) {
    return testCase.input.scenario.trim();
  }

  return testCase.title;
}

function extractAnswerText(responseText: string) {
  const trimmed = responseText.trim();

  if (!trimmed) {
    throw new KnowledgeRunnerExecutionError("Endpoint target returned an empty response.");
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const answer = answerFromJson(parsed);

    if (answer) {
      return boundedText(answer, 8000);
    }
  } catch {
    return boundedText(trimmed, 8000);
  }

  return boundedText(trimmed, 8000);
}

function answerFromJson(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;

  for (const key of ["answer", "message", "content", "output", "text"]) {
    const candidate = record[key];

    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return JSON.stringify(record);
}

function knowledgeRunnerMetadata(metadata: JsonRecord): JsonRecord {
  return {
    ...metadata,
    runner: "knowledge",
    runnerVersion: knowledgeRunnerVersion,
  };
}

function boundedText(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? boundedText(error.message, 2000) : "Knowledge Runner execution failed.";
}

export class KnowledgeRunnerExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KnowledgeRunnerExecutionError";
  }
}
