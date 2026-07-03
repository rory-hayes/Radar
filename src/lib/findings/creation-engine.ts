import "server-only";

import { createHash } from "node:crypto";

import type { RadarAssertion, RadarTestCase } from "@/lib/assertions/schema";
import type { FindingEvidenceInput, FindingInput, RadarFinding } from "@/lib/findings/schema";
import type { EvaluationEvidenceRefInput, RadarTestCaseResult, TestCaseResultStatus } from "@/lib/evaluation/schema";
import {
  assessSeverityAndImpact,
  nextFindingRepeatCount,
  severityImpactModelVersion,
  type SeverityImpactAssessment,
} from "@/lib/findings/severity-impact-model";
import {
  addFindingEvidence,
  createFinding,
  getFindingByDedupeKey,
  recordFindingActivity,
  updateFindingOccurrence,
  type JsonRecord,
  type RadarEvaluationRunJob,
  type RadarRepositoryClient,
} from "@/lib/repositories";

export const findingCreationEngineVersion = "rad-071";

export type FindingCreationInput = {
  workspaceId: string;
  assertion: RadarAssertion;
  testCase: RadarTestCase;
  run: RadarEvaluationRunJob;
  result: RadarTestCaseResult;
  now?: string;
};

export type FindingCreationResult =
  | {
      status: "created" | "updated";
      finding: RadarFinding;
      dedupeKey: string;
      evidenceCount: number;
    }
  | {
      status: "skipped";
      reason: "non_actionable_status" | "workspace_mismatch";
      dedupeKey?: string;
    };

const actionableResultStatuses = ["failed", "warning"] as const satisfies readonly TestCaseResultStatus[];
const inactiveFindingStatuses = ["resolved", "ignored", "false_positive"] as const;

export async function createOrUpdateFindingForResult(
  client: RadarRepositoryClient,
  input: FindingCreationInput,
): Promise<FindingCreationResult> {
  if (!isWorkspaceConsistent(input)) {
    return { status: "skipped", reason: "workspace_mismatch" };
  }

  if (!isActionableStatus(input.result.status)) {
    return { status: "skipped", reason: "non_actionable_status" };
  }

  const now = input.now ?? new Date().toISOString();
  const dedupeKey = findingDedupeKey(input);
  const existing = await getFindingByDedupeKey(client, input.workspaceId, dedupeKey);
  const shouldUpdateExisting = existing ? !isInactiveFindingStatus(existing.status) : false;
  const risk = assessSeverityAndImpact({
    assertion: input.assertion,
    testCase: input.testCase,
    result: input.result,
    repeatCount: shouldUpdateExisting ? nextFindingRepeatCount(existing) : 1,
  });
  const findingInput = findingInputFromResult(input, now, risk);
  const finding = existing && shouldUpdateExisting
    ? await updateFindingOccurrence(client, input.workspaceId, existing.id, {
        evaluationRunId: findingInput.evaluationRunId,
        testCaseResultId: findingInput.testCaseResultId,
        summary: findingInput.summary,
        actual: findingInput.actual,
        severity: findingInput.severity,
        confidence: findingInput.confidence,
        lastSeenAt: now,
        metadata: {
          ...findingInput.metadata,
          previousFindingId: existing.id,
          firstSeenPreserved: true,
        },
      })
    : await createFinding(client, input.workspaceId, findingInput);
  const evidenceInputs = evidenceInputsFromResult(input, finding.id);

  await Promise.all(evidenceInputs.map((evidence) => addFindingEvidence(client, input.workspaceId, evidence)));
  await recordFindingActivity(client, input.workspaceId, {
    findingId: finding.id,
    activityType: shouldUpdateExisting ? "evidence_added" : "created",
    note: shouldUpdateExisting
      ? "Repeated runner failure updated this finding."
      : "Runner failure created this finding.",
    metadata: {
      engineVersion: findingCreationEngineVersion,
      evaluationRunId: input.run.id,
      testCaseResultId: input.result.id,
    },
  });

  return {
    status: shouldUpdateExisting ? "updated" : "created",
    finding,
    dedupeKey: findingInput.dedupeKey,
    evidenceCount: evidenceInputs.length,
  };
}

export function findingInputFromResult(
  input: FindingCreationInput,
  now = new Date().toISOString(),
  risk = assessSeverityAndImpact({
    assertion: input.assertion,
    testCase: input.testCase,
    result: input.result,
    repeatCount: 1,
  }),
): FindingInput {
  const confidence = boundedConfidence(input.result.confidence ?? input.result.score ?? 0.65);
  const actual = actualTextFromResult(input.result.actualOutput);

  return {
    assertionId: input.assertion.id,
    evaluationRunId: input.run.id,
    testCaseResultId: input.result.id,
    title: boundedText(`${input.assertion.title}: ${statusLabel(input.result.status)}`, 180),
    summary: boundedText(
      `${input.testCase.title} returned ${input.result.status}. Radar expected: ${input.testCase.expectedResult}`,
      2000,
    ),
    expected: boundedText(input.testCase.expectedResult, 2000),
    actual,
    severity: risk.severity,
    status: "open",
    confidence,
    customerImpact: risk.customerImpact,
    recommendedFix: "Review the failing assertion evidence, update the source of truth or customer-facing handoff, then rerun the assertion.",
    dedupeKey: findingDedupeKey(input),
    firstSeenAt: now,
    lastSeenAt: now,
    metadata: {
      engineVersion: findingCreationEngineVersion,
      runnerType: input.result.runnerType,
      resultStatus: input.result.status,
      score: input.result.score,
      confidence,
      severityImpactModelVersion,
      impactLevel: risk.impactLevel,
      repeatCount: risk.repeatCount,
      riskFactors: risk.factors,
    },
  };
}

export function findingDedupeKey(input: FindingCreationInput) {
  return createHash("sha256")
    .update([
      findingCreationEngineVersion,
      input.workspaceId,
      input.assertion.id,
      input.testCase.id,
      input.result.runnerType,
      input.result.status,
      stableFailureFingerprint(input.result.actualOutput),
    ].join(":"))
    .digest("hex");
}

export function severityForResult(input: FindingCreationInput, repeatCount = 1) {
  return assessSeverityAndImpact({
    assertion: input.assertion,
    testCase: input.testCase,
    result: input.result,
    repeatCount,
  }).severity;
}

function evidenceInputsFromResult(input: FindingCreationInput, findingId: string): FindingEvidenceInput[] {
  const runOutput: FindingEvidenceInput = {
    findingId,
    evidenceType: "run_output",
    evaluationRunId: input.run.id,
    testCaseResultId: input.result.id,
    quote: boundedText(actualTextFromResult(input.result.actualOutput), 2000),
    confidence: boundedConfidence(input.result.confidence ?? input.result.score ?? 0.65),
    metadata: {
      engineVersion: findingCreationEngineVersion,
      resultStatus: input.result.status,
    },
  };

  return [
    runOutput,
    ...input.result.evidenceRefs.slice(0, 8).map((ref) => evidenceInputFromRef(findingId, input, ref)),
  ];
}

function evidenceInputFromRef(
  findingId: string,
  input: FindingCreationInput,
  ref: EvaluationEvidenceRefInput,
): FindingEvidenceInput {
  if (ref.sourceChunkId) {
    return {
      findingId,
      evidenceType: "source_chunk",
      sourceId: ref.sourceId,
      sourceDocumentId: ref.sourceDocumentId,
      sourceChunkId: ref.sourceChunkId,
      evaluationRunId: input.run.id,
      testCaseResultId: input.result.id,
      citation: ref.citation,
      confidence: ref.score,
      metadata: { engineVersion: findingCreationEngineVersion },
    };
  }

  if (ref.sourceDocumentId) {
    return {
      findingId,
      evidenceType: "source_document",
      sourceId: ref.sourceId,
      sourceDocumentId: ref.sourceDocumentId,
      evaluationRunId: input.run.id,
      testCaseResultId: input.result.id,
      citation: ref.citation,
      confidence: ref.score,
      metadata: { engineVersion: findingCreationEngineVersion },
    };
  }

  return {
    findingId,
    evidenceType: ref.storagePath ? "artifact" : "run_output",
    evaluationRunId: input.run.id,
    testCaseResultId: input.result.id,
    artifactPath: ref.storagePath,
    citation: ref.citation,
    confidence: ref.score,
    metadata: { engineVersion: findingCreationEngineVersion },
  };
}

function isWorkspaceConsistent(input: FindingCreationInput) {
  return input.assertion.workspaceId === input.workspaceId
    && input.testCase.workspaceId === input.workspaceId
    && input.run.workspaceId === input.workspaceId
    && input.result.workspaceId === input.workspaceId
    && input.testCase.assertionId === input.assertion.id
    && input.result.assertionId === input.assertion.id
    && input.result.testCaseId === input.testCase.id;
}

function isActionableStatus(status: TestCaseResultStatus): status is (typeof actionableResultStatuses)[number] {
  return actionableResultStatuses.includes(status as (typeof actionableResultStatuses)[number]);
}

function isInactiveFindingStatus(status: RadarFinding["status"]) {
  return inactiveFindingStatuses.includes(status as (typeof inactiveFindingStatuses)[number]);
}

function actualTextFromResult(actualOutput: JsonRecord) {
  const summary = stringValue(actualOutput.summary)
    ?? stringValue(actualOutput.actual)
    ?? stringValue(actualOutput.answer)
    ?? stringValue(actualOutput.error);

  const text = boundedText(summary ?? JSON.stringify(actualOutput), 2000);
  return text.length >= 4 ? text : "No runner output captured.";
}

function stableFailureFingerprint(actualOutput: JsonRecord) {
  return boundedText(JSON.stringify(actualOutput, Object.keys(actualOutput).sort()), 500);
}

function statusLabel(status: TestCaseResultStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function boundedConfidence(value: number) {
  return Math.min(1, Math.max(0, value));
}

function boundedText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 3)}...`;
}
