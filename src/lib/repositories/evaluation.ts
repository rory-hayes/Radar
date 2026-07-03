import "server-only";

import {
  evaluationRunSchema,
  testCaseResultSchema,
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

export async function createEvaluationRun(
  client: RadarRepositoryClient,
  workspaceId: string,
  input: EvaluationRunInput,
) {
  const parsedInput = evaluationRunSchema.parse(input);
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

export async function updateEvaluationRunStatus(
  client: RadarRepositoryClient,
  workspaceId: string,
  evaluationRunId: string,
  status: EvaluationRunStatus,
) {
  const { data, error } = await client
    .from("evaluation_runs")
    .update({ status })
    .eq("workspace_id", workspaceId)
    .eq("id", evaluationRunId)
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
  const parsedInput = testCaseResultSchema.parse(input);
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
  return {
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
  };
}

function mapTestCaseResultRow(row: TestCaseResultRow): RadarTestCaseResult {
  return {
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
  };
}
