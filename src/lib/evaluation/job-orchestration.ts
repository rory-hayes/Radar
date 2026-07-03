import "server-only";

import { randomUUID } from "node:crypto";

import { type RunnerType } from "@/lib/assertions/schema";
import {
  claimQueuedEvaluationRun,
  createEvaluationRun,
  listQueuedEvaluationRunsForWorkspace,
  updateEvaluationRunJob,
  type JsonRecord,
  type RadarEvaluationRunJob,
  type RadarRepositoryClient,
} from "@/lib/repositories";
import {
  type EvaluationRunStatus,
  type EvaluationRunTriggerType,
} from "@/lib/evaluation/schema";
import { processFindingRerunResolutionForRun } from "@/lib/findings/rerun-resolution";

export const evaluationJobQueueReasons = ["manual", "schedule", "source_change", "system"] as const;

export type EvaluationJobQueueReason = (typeof evaluationJobQueueReasons)[number];
export type EvaluationJobTerminalStatus = Exclude<EvaluationRunStatus, "queued" | "running" | "canceled">;

export type QueueEvaluationJobInput = {
  workspaceId: string;
  assertionId: string;
  runnerType: RunnerType;
  triggerType: EvaluationRunTriggerType;
  totalTestCases: number;
  triggeredByUserId?: string;
  queueReason: EvaluationJobQueueReason;
  metadata?: JsonRecord;
};

export type EvaluationJobRunnerResult = {
  status: EvaluationJobTerminalStatus;
  totalTestCases?: number;
  passedCount?: number;
  warningCount?: number;
  failedCount?: number;
  errorCount?: number;
  skippedCount?: number;
  score?: number;
  confidence?: number;
  evidenceRefs?: unknown[];
  executionMetadata?: JsonRecord;
  errorMessage?: string;
};

export type EvaluationJobContext = {
  jobId: string;
  attempt: number;
  maxAttempts: number;
  run: RadarEvaluationRunJob;
};

export type EvaluationJobRunner = (context: EvaluationJobContext) => Promise<EvaluationJobRunnerResult>;

export type RunNextEvaluationJobInput = {
  workspaceId: string;
  jobId?: string;
  now?: string;
};

export type EvaluationJobOptions = {
  maxAttempts?: number;
  baseRetryDelayMs?: number;
};

export type EvaluationJobOrchestrationResult =
  | {
      status: "queued";
      run: Awaited<ReturnType<typeof createEvaluationRun>>;
    }
  | {
      status: "completed";
      run: RadarEvaluationRunJob;
      attempt: number;
    }
  | {
      status: "retry_scheduled";
      run: RadarEvaluationRunJob;
      attempt: number;
      nextAttemptAt: string;
    }
  | {
      status: "error";
      run: RadarEvaluationRunJob;
      attempt: number;
    }
  | {
      status: "skipped";
      reason: "no_due_runs" | "claim_lost";
    };

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_RETRY_DELAY_MS = 60_000;
const ORCHESTRATOR_VERSION = "rad-051";

export async function queueEvaluationJob(
  client: RadarRepositoryClient,
  input: QueueEvaluationJobInput,
  options: { queuedAt?: string } = {},
): Promise<EvaluationJobOrchestrationResult> {
  const queuedAt = options.queuedAt ?? new Date().toISOString();
  const run = await createEvaluationRun(client, input.workspaceId, {
    assertionId: input.assertionId,
    runnerType: input.runnerType,
    status: "queued",
    triggerType: input.triggerType,
    triggeredByUserId: input.triggeredByUserId,
    totalTestCases: input.totalTestCases,
    passedCount: 0,
    warningCount: 0,
    failedCount: 0,
    errorCount: 0,
    skippedCount: 0,
    evidenceRefs: [],
    executionMetadata: mergeMetadata(input.metadata, {
      orchestration: {
        version: ORCHESTRATOR_VERSION,
        state: "queued",
        queueReason: input.queueReason,
        queuedAt,
        attempts: 0,
      },
    }),
  });

  return { status: "queued", run };
}

export async function runNextEvaluationJob(
  client: RadarRepositoryClient,
  input: RunNextEvaluationJobInput,
  runner: EvaluationJobRunner,
  options: EvaluationJobOptions = {},
): Promise<EvaluationJobOrchestrationResult> {
  const now = input.now ?? new Date().toISOString();
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseRetryDelayMs = options.baseRetryDelayMs ?? DEFAULT_BASE_RETRY_DELAY_MS;
  const queuedRuns = await listQueuedEvaluationRunsForWorkspace(client, input.workspaceId, { now, limit: 1 });
  const queuedRun = queuedRuns[0];

  if (!queuedRun) {
    return { status: "skipped", reason: "no_due_runs" };
  }

  const jobId = input.jobId ?? randomUUID();
  const attempt = attemptCount(queuedRun.executionMetadata) + 1;
  const startedAt = now;
  const claimedRun = await claimQueuedEvaluationRun(client, input.workspaceId, queuedRun.id, {
    startedAt,
    executionMetadata: mergeMetadata(queuedRun.executionMetadata, {
      orchestration: {
        version: ORCHESTRATOR_VERSION,
        state: "running",
        jobId,
        attempts: attempt,
        maxAttempts,
        startedAt,
      },
    }),
  });

  if (!claimedRun) {
    return { status: "skipped", reason: "claim_lost" };
  }

  try {
    const result = await runner({ jobId, attempt, maxAttempts, run: claimedRun });
    const completedAt = new Date().toISOString();
    const completedRun = await updateEvaluationRunJob(client, input.workspaceId, claimedRun.id, {
      status: result.status,
      completedAt,
      durationMs: elapsedMs(startedAt, completedAt),
      totalTestCases: result.totalTestCases ?? claimedRun.totalTestCases,
      passedCount: result.passedCount ?? claimedRun.passedCount,
      warningCount: result.warningCount ?? claimedRun.warningCount,
      failedCount: result.failedCount ?? claimedRun.failedCount,
      errorCount: result.errorCount ?? claimedRun.errorCount,
      skippedCount: result.skippedCount ?? claimedRun.skippedCount,
      score: result.score ?? claimedRun.score,
      confidence: result.confidence ?? claimedRun.confidence,
      evidenceRefs: result.evidenceRefs ?? claimedRun.evidenceRefs,
      errorMessage: result.errorMessage ?? null,
      executionMetadata: mergeMetadata(claimedRun.executionMetadata, result.executionMetadata, {
        orchestration: {
          version: ORCHESTRATOR_VERSION,
          state: "completed",
          jobId,
          attempts: attempt,
          maxAttempts,
          completedAt,
        },
      }),
    });
    await processFindingRerunResolutionForRun(client, input.workspaceId, completedRun);

    return { status: "completed", run: completedRun, attempt };
  } catch (error) {
    return handleJobFailure(client, input.workspaceId, claimedRun, {
      jobId,
      attempt,
      maxAttempts,
      startedAt,
      baseRetryDelayMs,
      error,
    });
  }
}

async function handleJobFailure(
  client: RadarRepositoryClient,
  workspaceId: string,
  run: RadarEvaluationRunJob,
  input: {
    jobId: string;
    attempt: number;
    maxAttempts: number;
    startedAt: string;
    baseRetryDelayMs: number;
    error: unknown;
  },
): Promise<EvaluationJobOrchestrationResult> {
  const completedAt = new Date().toISOString();
  const errorMessage = jobErrorMessage(input.error);

  if (input.attempt < input.maxAttempts) {
    const nextAttemptAt = nextRetryAt(completedAt, input.attempt, input.baseRetryDelayMs);
    const retriedRun = await updateEvaluationRunJob(client, workspaceId, run.id, {
      status: "queued",
      scheduledFor: nextAttemptAt,
      startedAt: null,
      completedAt: null,
      durationMs: elapsedMs(input.startedAt, completedAt),
      errorMessage,
      executionMetadata: mergeMetadata(run.executionMetadata, {
        orchestration: {
          version: ORCHESTRATOR_VERSION,
          state: "retry_scheduled",
          jobId: input.jobId,
          attempts: input.attempt,
          maxAttempts: input.maxAttempts,
          lastError: errorMessage,
          nextAttemptAt,
        },
      }),
    });

    return {
      status: "retry_scheduled",
      run: retriedRun,
      attempt: input.attempt,
      nextAttemptAt,
    };
  }

  const failedRun = await updateEvaluationRunJob(client, workspaceId, run.id, {
    status: "error",
    completedAt,
    durationMs: elapsedMs(input.startedAt, completedAt),
    errorCount: Math.max(run.errorCount, 1),
    errorMessage,
    executionMetadata: mergeMetadata(run.executionMetadata, {
      orchestration: {
        version: ORCHESTRATOR_VERSION,
        state: "error",
        jobId: input.jobId,
        attempts: input.attempt,
        maxAttempts: input.maxAttempts,
        lastError: errorMessage,
        completedAt,
      },
    }),
  });

  return { status: "error", run: failedRun, attempt: input.attempt };
}

function mergeMetadata(...metadata: Array<JsonRecord | undefined>) {
  return metadata.reduce<JsonRecord>((merged, current) => {
    if (!current) return merged;

    return {
      ...merged,
      ...current,
      orchestration: {
        ...jsonObject(merged.orchestration),
        ...jsonObject(current.orchestration),
      },
    };
  }, {});
}

function attemptCount(metadata: JsonRecord) {
  const attempts = jsonObject(metadata.orchestration).attempts;
  return typeof attempts === "number" && Number.isInteger(attempts) && attempts >= 0 ? attempts : 0;
}

function nextRetryAt(fromIso: string, attempt: number, baseRetryDelayMs: number) {
  const delayMs = baseRetryDelayMs * 2 ** Math.max(attempt - 1, 0);
  return new Date(new Date(fromIso).getTime() + delayMs).toISOString();
}

function elapsedMs(startIso: string, endIso: string) {
  return Math.max(0, new Date(endIso).getTime() - new Date(startIso).getTime());
}

function jobErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim().slice(0, 2000);
  }

  return "Evaluation job failed.".slice(0, 2000);
}

function jsonObject(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}
