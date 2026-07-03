import "server-only";

import {
  type EvaluationRunInput,
  type EvaluationRunStatus,
  type EvaluationRunTriggerType,
  type RadarEvaluationRun,
  type RadarTestCaseResult,
  type TestCaseResultInput,
  type TestCaseResultStatus,
} from "@/lib/evaluation/schema";
import { type RunnerType } from "@/lib/assertions/schema";
import {
  evaluationRunCreateRequestSchema,
  evaluationRunResponseSchema,
  evaluationRunStatusUpdateRequestSchema,
  testCaseResultCreateRequestSchema,
  testCaseResultResponseSchema,
} from "@/lib/validation";
import {
  assertRepositorySuccess,
  jsonRecord,
  optionalNumber,
  optionalString,
  requireRepositoryRow,
  type JsonRecord,
  type RadarRepositoryClient,
} from "@/lib/repositories/client";

type EvaluationRunRow = {
  id: string;
  workspace_id: string;
  assertion_id: string;
  runner_type: RunnerType;
  status: EvaluationRunStatus;
  trigger_type: EvaluationRunTriggerType;
  triggered_by_user_id: string | null;
  total_test_cases: number;
  score: number | null;
  confidence: number | null;
};

type EvaluationRunSummaryRow = EvaluationRunRow & {
  created_at: string;
  completed_at: string | null;
  passed_count: number;
  warning_count: number;
  failed_count: number;
  error_count: number;
  skipped_count: number;
};

type EvaluationRunJobRow = EvaluationRunSummaryRow & {
  scheduled_for: string | null;
  started_at: string | null;
  duration_ms: number | null;
  evidence_refs: unknown;
  execution_metadata: unknown;
  error_message: string | null;
};

type TestCaseResultRow = {
  id: string;
  workspace_id: string;
  evaluation_run_id: string;
  assertion_id: string;
  test_case_id: string;
  runner_type: RunnerType;
  status: TestCaseResultStatus;
  score: number | null;
  confidence: number | null;
  actual_output: JsonRecord;
  evidence_refs: unknown;
};

const evaluationRunSelect =
  "id, workspace_id, assertion_id, runner_type, status, trigger_type, triggered_by_user_id, total_test_cases, score, confidence";
const evaluationRunSummarySelect = `${evaluationRunSelect}, created_at, completed_at, passed_count, warning_count, failed_count, error_count, skipped_count`;
const evaluationRunJobSelect = `${evaluationRunSummarySelect}, scheduled_for, started_at, duration_ms, evidence_refs, execution_metadata, error_message`;

export type RadarEvaluationRunSummary = RadarEvaluationRun & {
  createdAt: string;
  completedAt?: string;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  errorCount: number;
  skippedCount: number;
};

export type RadarEvaluationRunJob = RadarEvaluationRunSummary & {
  scheduledFor?: string;
  startedAt?: string;
  durationMs?: number;
  evidenceRefs: unknown[];
  executionMetadata: JsonRecord;
  errorMessage?: string;
};

export type EvaluationRunJobUpdateInput = {
  status: EvaluationRunStatus;
  scheduledFor?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs?: number | null;
  totalTestCases?: number;
  passedCount?: number;
  warningCount?: number;
  failedCount?: number;
  errorCount?: number;
  skippedCount?: number;
  score?: number | null;
  confidence?: number | null;
  evidenceRefs?: unknown[];
  executionMetadata?: JsonRecord;
  errorMessage?: string | null;
};

export async function listEvaluationRunsForAssertion(
  client: RadarRepositoryClient,
  workspaceId: string,
  assertionId: string,
) {
  const { data, error } = await client
    .from("evaluation_runs")
    .select(evaluationRunSelect)
    .eq("workspace_id", workspaceId)
    .eq("assertion_id", assertionId)
    .order("created_at", { ascending: false })
    .returns<EvaluationRunRow[]>();

  assertRepositorySuccess(error, "Unable to list evaluation runs");
  return (data ?? []).map(mapEvaluationRunRow);
}

export async function listEvaluationRunSummariesForAssertion(
  client: RadarRepositoryClient,
  workspaceId: string,
  assertionId: string,
  options: { limit?: number } = {},
) {
  const { data, error } = await client
    .from("evaluation_runs")
    .select(evaluationRunSummarySelect)
    .eq("workspace_id", workspaceId)
    .eq("assertion_id", assertionId)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 8)
    .returns<EvaluationRunSummaryRow[]>();

  assertRepositorySuccess(error, "Unable to list assertion run history");
  return (data ?? []).map(mapEvaluationRunSummaryRow);
}

export async function listLatestEvaluationRunsForAssertions(
  client: RadarRepositoryClient,
  workspaceId: string,
  assertionIds: readonly string[],
) {
  if (assertionIds.length === 0) {
    return {};
  }

  const { data, error } = await client
    .from("evaluation_runs")
    .select(evaluationRunSummarySelect)
    .eq("workspace_id", workspaceId)
    .in("assertion_id", [...assertionIds])
    .order("created_at", { ascending: false })
    .returns<EvaluationRunSummaryRow[]>();

  assertRepositorySuccess(error, "Unable to list latest assertion runs");

  return (data ?? []).reduce<Record<string, RadarEvaluationRunSummary>>((runsByAssertion, row) => {
    if (!runsByAssertion[row.assertion_id]) {
      runsByAssertion[row.assertion_id] = mapEvaluationRunSummaryRow(row);
    }

    return runsByAssertion;
  }, {});
}

export async function listQueuedEvaluationRunsForWorkspace(
  client: RadarRepositoryClient,
  workspaceId: string,
  options: { now?: string; limit?: number } = {},
) {
  const now = options.now ?? new Date().toISOString();
  const { data, error } = await client
    .from("evaluation_runs")
    .select(evaluationRunJobSelect)
    .eq("workspace_id", workspaceId)
    .eq("status", "queued")
    .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
    .order("scheduled_for", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true })
    .limit(options.limit ?? 10)
    .returns<EvaluationRunJobRow[]>();

  assertRepositorySuccess(error, "Unable to list queued evaluation runs");
  return (data ?? []).map(mapEvaluationRunJobRow);
}

export async function getEvaluationRunJob(
  client: RadarRepositoryClient,
  workspaceId: string,
  evaluationRunId: string,
) {
  const { data, error } = await client
    .from("evaluation_runs")
    .select(evaluationRunJobSelect)
    .eq("workspace_id", workspaceId)
    .eq("id", evaluationRunId)
    .maybeSingle<EvaluationRunJobRow>();

  assertRepositorySuccess(error, "Unable to load evaluation run job");
  return data ? mapEvaluationRunJobRow(data) : null;
}

export async function createEvaluationRun(
  client: RadarRepositoryClient,
  workspaceId: string,
  input: EvaluationRunInput,
) {
  const parsedInput = evaluationRunCreateRequestSchema.parse(input);
  const { data, error } = await client
    .from("evaluation_runs")
    .insert({
      workspace_id: workspaceId,
      assertion_id: parsedInput.assertionId,
      runner_type: parsedInput.runnerType,
      status: parsedInput.status,
      trigger_type: parsedInput.triggerType,
      triggered_by_user_id: parsedInput.triggeredByUserId ?? null,
      scheduled_for: parsedInput.scheduledFor ?? null,
      started_at: parsedInput.startedAt ?? null,
      completed_at: parsedInput.completedAt ?? null,
      duration_ms: parsedInput.durationMs ?? null,
      total_test_cases: parsedInput.totalTestCases,
      passed_count: parsedInput.passedCount,
      warning_count: parsedInput.warningCount,
      failed_count: parsedInput.failedCount,
      error_count: parsedInput.errorCount,
      skipped_count: parsedInput.skippedCount,
      score: parsedInput.score ?? null,
      confidence: parsedInput.confidence ?? null,
      evidence_refs: parsedInput.evidenceRefs,
      execution_metadata: parsedInput.executionMetadata,
      error_message: parsedInput.errorMessage ?? null,
    })
    .select(evaluationRunSelect)
    .single<EvaluationRunRow>();

  assertRepositorySuccess(error, "Unable to create evaluation run");
  return mapEvaluationRunRow(requireRepositoryRow(data, "Evaluation run insert returned no row"));
}

export async function updateEvaluationRunJob(
  client: RadarRepositoryClient,
  workspaceId: string,
  evaluationRunId: string,
  input: EvaluationRunJobUpdateInput,
) {
  const update: Record<string, unknown> = {
    status: input.status,
  };

  if ("scheduledFor" in input) update.scheduled_for = input.scheduledFor ?? null;
  if ("startedAt" in input) update.started_at = input.startedAt ?? null;
  if ("completedAt" in input) update.completed_at = input.completedAt ?? null;
  if ("durationMs" in input) update.duration_ms = input.durationMs ?? null;
  if (input.totalTestCases !== undefined) update.total_test_cases = input.totalTestCases;
  if (input.passedCount !== undefined) update.passed_count = input.passedCount;
  if (input.warningCount !== undefined) update.warning_count = input.warningCount;
  if (input.failedCount !== undefined) update.failed_count = input.failedCount;
  if (input.errorCount !== undefined) update.error_count = input.errorCount;
  if (input.skippedCount !== undefined) update.skipped_count = input.skippedCount;
  if ("score" in input) update.score = input.score ?? null;
  if ("confidence" in input) update.confidence = input.confidence ?? null;
  if (input.evidenceRefs !== undefined) update.evidence_refs = input.evidenceRefs;
  if (input.executionMetadata !== undefined) update.execution_metadata = input.executionMetadata;
  if ("errorMessage" in input) update.error_message = input.errorMessage ?? null;

  const { data, error } = await client
    .from("evaluation_runs")
    .update(update)
    .eq("workspace_id", workspaceId)
    .eq("id", evaluationRunId)
    .select(evaluationRunJobSelect)
    .single<EvaluationRunJobRow>();

  assertRepositorySuccess(error, "Unable to update evaluation run job");
  return mapEvaluationRunJobRow(requireRepositoryRow(data, "Evaluation run job update returned no row"));
}

export async function claimQueuedEvaluationRun(
  client: RadarRepositoryClient,
  workspaceId: string,
  evaluationRunId: string,
  input: {
    startedAt: string;
    executionMetadata: JsonRecord;
  },
) {
  const { data, error } = await client
    .from("evaluation_runs")
    .update({
      status: "running",
      scheduled_for: null,
      started_at: input.startedAt,
      completed_at: null,
      duration_ms: null,
      error_message: null,
      execution_metadata: input.executionMetadata,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", evaluationRunId)
    .eq("status", "queued")
    .select(evaluationRunJobSelect)
    .maybeSingle<EvaluationRunJobRow>();

  assertRepositorySuccess(error, "Unable to claim queued evaluation run");
  return data ? mapEvaluationRunJobRow(data) : null;
}

export async function updateEvaluationRunStatus(
  client: RadarRepositoryClient,
  workspaceId: string,
  evaluationRunId: string,
  status: EvaluationRunStatus,
) {
  const parsedInput = evaluationRunStatusUpdateRequestSchema.parse({ evaluationRunId, status });
  const { data, error } = await client
    .from("evaluation_runs")
    .update({ status: parsedInput.status })
    .eq("workspace_id", workspaceId)
    .eq("id", parsedInput.evaluationRunId)
    .select(evaluationRunSelect)
    .single<EvaluationRunRow>();

  assertRepositorySuccess(error, "Unable to update evaluation run");
  return mapEvaluationRunRow(requireRepositoryRow(data, "Evaluation run update returned no row"));
}

export async function listTestCaseResultsForRun(
  client: RadarRepositoryClient,
  workspaceId: string,
  evaluationRunId: string,
) {
  const { data, error } = await client
    .from("test_case_results")
    .select("id, workspace_id, evaluation_run_id, assertion_id, test_case_id, runner_type, status, score, confidence, actual_output, evidence_refs")
    .eq("workspace_id", workspaceId)
    .eq("evaluation_run_id", evaluationRunId)
    .order("created_at", { ascending: true })
    .returns<TestCaseResultRow[]>();

  assertRepositorySuccess(error, "Unable to list test case results");
  return (data ?? []).map(mapTestCaseResultRow);
}

export async function createTestCaseResult(
  client: RadarRepositoryClient,
  workspaceId: string,
  input: TestCaseResultInput,
) {
  const parsedInput = testCaseResultCreateRequestSchema.parse(input);
  const { data, error } = await client
    .from("test_case_results")
    .insert({
      workspace_id: workspaceId,
      evaluation_run_id: parsedInput.evaluationRunId,
      assertion_id: parsedInput.assertionId,
      test_case_id: parsedInput.testCaseId,
      runner_type: parsedInput.runnerType,
      status: parsedInput.status,
      score: parsedInput.score ?? null,
      confidence: parsedInput.confidence ?? null,
      actual_output: parsedInput.actualOutput,
      actual_summary: parsedInput.actualSummary ?? null,
      evaluator_summary: parsedInput.evaluatorSummary ?? null,
      evidence_refs: parsedInput.evidenceRefs,
      execution_metadata: parsedInput.executionMetadata,
      error_message: parsedInput.errorMessage ?? null,
      started_at: parsedInput.startedAt ?? null,
      completed_at: parsedInput.completedAt ?? null,
      duration_ms: parsedInput.durationMs ?? null,
    })
    .select("id, workspace_id, evaluation_run_id, assertion_id, test_case_id, runner_type, status, score, confidence, actual_output, evidence_refs")
    .single<TestCaseResultRow>();

  assertRepositorySuccess(error, "Unable to create test case result");
  return mapTestCaseResultRow(requireRepositoryRow(data, "Test case result insert returned no row"));
}

function mapEvaluationRunRow(row: EvaluationRunRow): RadarEvaluationRun {
  return evaluationRunResponseSchema.parse({
    id: row.id,
    workspaceId: row.workspace_id,
    assertionId: row.assertion_id,
    runnerType: row.runner_type,
    status: row.status,
    triggerType: row.trigger_type,
    triggeredByUserId: optionalString(row.triggered_by_user_id),
    totalTestCases: row.total_test_cases,
    score: optionalNumber(row.score),
    confidence: optionalNumber(row.confidence),
  });
}

function mapEvaluationRunSummaryRow(row: EvaluationRunSummaryRow): RadarEvaluationRunSummary {
  const summary: RadarEvaluationRunSummary = {
    ...mapEvaluationRunRow(row),
    createdAt: row.created_at,
    passedCount: row.passed_count,
    warningCount: row.warning_count,
    failedCount: row.failed_count,
    errorCount: row.error_count,
    skippedCount: row.skipped_count,
  };

  if (row.completed_at) {
    summary.completedAt = row.completed_at;
  }

  return summary;
}

function mapEvaluationRunJobRow(row: EvaluationRunJobRow): RadarEvaluationRunJob {
  const job: RadarEvaluationRunJob = {
    ...mapEvaluationRunSummaryRow(row),
    evidenceRefs: Array.isArray(row.evidence_refs) ? row.evidence_refs : [],
    executionMetadata: jsonRecord(row.execution_metadata),
  };

  if (row.scheduled_for) job.scheduledFor = row.scheduled_for;
  if (row.started_at) job.startedAt = row.started_at;
  if (row.duration_ms !== null) job.durationMs = row.duration_ms;
  if (row.error_message) job.errorMessage = row.error_message;

  return job;
}

function mapTestCaseResultRow(row: TestCaseResultRow): RadarTestCaseResult {
  return testCaseResultResponseSchema.parse({
    id: row.id,
    workspaceId: row.workspace_id,
    evaluationRunId: row.evaluation_run_id,
    assertionId: row.assertion_id,
    testCaseId: row.test_case_id,
    runnerType: row.runner_type,
    status: row.status,
    score: optionalNumber(row.score),
    confidence: optionalNumber(row.confidence),
    actualOutput: jsonRecord(row.actual_output),
    evidenceRefs: Array.isArray(row.evidence_refs) ? row.evidence_refs : [],
  });
}
