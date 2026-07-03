import "server-only";

import type { RadarAssertion, RadarTestCase, RunnerType } from "@/lib/assertions/schema";
import type {
  EvaluationEvidenceRefInput,
  EvaluationRunTriggerType,
  TestCaseResultStatus,
} from "@/lib/evaluation/schema";
import type { JsonRecord, RadarEvaluationRunJob } from "@/lib/repositories";

export const sharedRunnerContractVersion = "rad-061";

export const runnerArtifactKinds = [
  "source_evidence",
  "screenshot",
  "trace",
  "http_exchange",
  "email_receipt",
  "webhook_event",
  "redacted_log",
] as const;

export type RunnerArtifactKind = (typeof runnerArtifactKinds)[number];
export type RunnerTerminalStatus = Exclude<TestCaseResultStatus, "skipped">;

export type RunnerEvidenceArtifact = {
  kind: RunnerArtifactKind;
  label: string;
  storagePath?: string;
  sourceId?: string;
  sourceDocumentId?: string;
  sourceChunkId?: string;
  metadata?: JsonRecord;
  redacted: boolean;
};

export type RunnerRetrySemantics = {
  attempt: number;
  maxAttempts: number;
  retryable: boolean;
  retryReason?: string;
};

export type SharedRunnerContext = {
  workspaceId: string;
  assertion: RadarAssertion;
  run: RadarEvaluationRunJob;
  triggerType: EvaluationRunTriggerType;
  runnerType: RunnerType;
  attempt: number;
  maxAttempts: number;
};

export type SharedRunnerTestCaseInput = {
  testCase: RadarTestCase;
  evidenceRefs: EvaluationEvidenceRefInput[];
  artifacts: RunnerEvidenceArtifact[];
};

export type SharedRunnerCaseResult = {
  testCaseId: string;
  status: TestCaseResultStatus;
  score?: number;
  confidence?: number;
  actualOutput: JsonRecord;
  actualSummary?: string;
  evaluatorSummary?: string;
  evidenceRefs: EvaluationEvidenceRefInput[];
  artifacts: RunnerEvidenceArtifact[];
  errorMessage?: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  executionMetadata: JsonRecord;
};

export type SharedRunnerExecutionResult = {
  status: RunnerTerminalStatus;
  totalTestCases: number;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  errorCount: number;
  skippedCount: number;
  score?: number;
  confidence?: number;
  evidenceRefs: EvaluationEvidenceRefInput[];
  artifacts: RunnerEvidenceArtifact[];
  executionMetadata: JsonRecord;
  errorMessage?: string;
};

export function assertRunnerTypeMatches(context: SharedRunnerContext) {
  if (context.run.runnerType !== context.runnerType || context.assertion.runnerType !== context.runnerType) {
    throw new SharedRunnerContractError("Runner context type does not match the evaluation run and assertion.");
  }
}

export function summarizeSharedRunnerCaseResults(
  results: readonly Pick<SharedRunnerCaseResult, "status" | "score" | "confidence" | "evidenceRefs" | "artifacts">[],
): Omit<SharedRunnerExecutionResult, "executionMetadata"> {
  const passedCount = results.filter((result) => result.status === "passed").length;
  const warningCount = results.filter((result) => result.status === "warning").length;
  const failedCount = results.filter((result) => result.status === "failed").length;
  const errorCount = results.filter((result) => result.status === "error").length;
  const skippedCount = results.filter((result) => result.status === "skipped").length;
  const scoredResults = results.filter((result) => typeof result.score === "number");
  const confidenceResults = results.filter((result) => typeof result.confidence === "number");

  return {
    status: aggregateRunnerStatus({ passedCount, warningCount, failedCount, errorCount, skippedCount }),
    totalTestCases: results.length,
    passedCount,
    warningCount,
    failedCount,
    errorCount,
    skippedCount,
    score: averageOptional(scoredResults.map((result) => result.score)),
    confidence: averageOptional(confidenceResults.map((result) => result.confidence)),
    evidenceRefs: dedupeRunnerEvidenceRefs(results.flatMap((result) => result.evidenceRefs)),
    artifacts: dedupeRunnerArtifacts(results.flatMap((result) => result.artifacts)),
  };
}

export function sharedRunnerContractMetadata(input: {
  runnerType: RunnerType;
  status: RunnerTerminalStatus;
  evidenceRefCount: number;
  artifactCount: number;
  retry: RunnerRetrySemantics;
}): JsonRecord {
  return {
    runnerContract: {
      version: sharedRunnerContractVersion,
      runnerType: input.runnerType,
      status: input.status,
      evidenceRefCount: input.evidenceRefCount,
      artifactCount: input.artifactCount,
      retry: input.retry,
    },
  };
}

function aggregateRunnerStatus(input: {
  passedCount: number;
  warningCount: number;
  failedCount: number;
  errorCount: number;
  skippedCount: number;
}): RunnerTerminalStatus {
  if (input.errorCount > 0) {
    return "error";
  }

  if (input.failedCount > 0) {
    return "failed";
  }

  if (input.warningCount > 0) {
    return "warning";
  }

  if (input.passedCount > 0 && input.skippedCount === 0) {
    return "passed";
  }

  return "inconclusive";
}

function averageOptional(values: readonly (number | undefined)[]) {
  const numericValues = values.filter((value): value is number => typeof value === "number");

  if (numericValues.length === 0) {
    return undefined;
  }

  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}

function dedupeRunnerEvidenceRefs(evidenceRefs: readonly EvaluationEvidenceRefInput[]) {
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

function dedupeRunnerArtifacts(artifacts: readonly RunnerEvidenceArtifact[]) {
  const seen = new Set<string>();
  return artifacts.filter((artifact) => {
    const key = [artifact.kind, artifact.storagePath, artifact.sourceId, artifact.sourceDocumentId, artifact.sourceChunkId, artifact.label].join(":");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export class SharedRunnerContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SharedRunnerContractError";
  }
}
