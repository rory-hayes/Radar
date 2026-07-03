import "server-only";

import type { RadarAssertion, RadarTestCase, RunnerType } from "@/lib/assertions/schema";
import type { EvaluationEvidenceRefInput, RadarTestCaseResult } from "@/lib/evaluation/schema";
import type { JsonRecord } from "@/lib/repositories";

export const recommendedFixGeneratorVersion = "rad-076";

export type RecommendedFixGuardrail = "evidence_grounded" | "runner_output_only" | "insufficient_evidence";

export type RecommendedFixFailureType =
  | "blocked_or_unavailable"
  | "missing_required_content"
  | "mismatch_or_contradiction"
  | "low_confidence_warning"
  | "failed_assertion";

export type RecommendedFixInput = {
  assertion: RadarAssertion;
  testCase: RadarTestCase;
  result: RadarTestCaseResult;
};

export type RecommendedFixResult = {
  recommendedFix: string;
  rationale: string;
  guardrail: RecommendedFixGuardrail;
  failureType: RecommendedFixFailureType;
  evidenceCount: number;
  sourceEvidenceCount: number;
  artifactEvidenceCount: number;
  sourceOwnerUserId?: string;
};

export function generateRecommendedFix(input: RecommendedFixInput): RecommendedFixResult {
  const evidenceSummary = summarizeEvidence(input.result.evidenceRefs);
  const guardrail = guardrailForEvidence(input.result.actualOutput, evidenceSummary.evidenceCount);
  const failureType = classifyFailure(input.result.actualOutput, input.result.status);
  const ownerPhrase = sourceOwnerPhrase(input.assertion.ownerUserId);
  const runnerFix = fixForRunner(input.result.runnerType, failureType);
  const evidencePhrase = evidenceInstruction(guardrail, evidenceSummary);
  const statusPhrase = input.result.status === "warning" ? "warning" : "failure";

  const recommendedFix = guardrail === "insufficient_evidence"
    ? `Capture source or artifact evidence for "${input.testCase.title}" before changing customer-facing behavior. Then ${runnerFix.rerunStep}`
    : `${ownerPhrase} should compare the captured ${evidencePhrase} with "${input.testCase.expectedResult}", ${runnerFix.action}, and ${runnerFix.rerunStep}`;

  return {
    recommendedFix: boundedText(recommendedFix, 1000),
    rationale: boundedText(
      `Generated from a ${input.result.runnerType} ${statusPhrase}, ${evidenceSummary.evidenceCount} evidence reference(s), and the bounded runner output only.`,
      500,
    ),
    guardrail,
    failureType,
    sourceOwnerUserId: input.assertion.ownerUserId,
    ...evidenceSummary,
  };
}

function fixForRunner(
  runnerType: RunnerType,
  failureType: RecommendedFixFailureType,
): { action: string; rerunStep: string } {
  const failureAction = actionForFailureType(failureType);

  if (runnerType === "knowledge") {
    return {
      action: `${failureAction} in the approved source of truth or the customer-facing answer target`,
      rerunStep: "rerun the Knowledge check",
    };
  }

  if (runnerType === "journey") {
    return {
      action: `${failureAction} in the affected journey step or handoff shown by the run output`,
      rerunStep: "rerun the Journey check",
    };
  }

  return {
    action: `${failureAction} in the integration configuration, response mapping, or endpoint behavior shown by the run output`,
    rerunStep: "rerun the Integration check",
  };
}

function actionForFailureType(failureType: RecommendedFixFailureType) {
  const actions: Record<RecommendedFixFailureType, string> = {
    blocked_or_unavailable: "restore the unavailable path and remove the blocker",
    missing_required_content: "add the missing required content",
    mismatch_or_contradiction: "reconcile the mismatch",
    low_confidence_warning: "review the uncertain evidence and tighten the source wording",
    failed_assertion: "correct the behavior that violates the assertion",
  };

  return actions[failureType];
}

function classifyFailure(actualOutput: JsonRecord, status: RadarTestCaseResult["status"]): RecommendedFixFailureType {
  const text = JSON.stringify(actualOutput).toLowerCase();

  if (/blocked|broken|timeout|unavailable|not found|error|failed to/i.test(text)) {
    return "blocked_or_unavailable";
  }

  if (/missing|omitted|absent|not included|required/i.test(text)) {
    return "missing_required_content";
  }

  if (/mismatch|contradict|incorrect|wrong|different|does not match/i.test(text)) {
    return "mismatch_or_contradiction";
  }

  if (status === "warning") {
    return "low_confidence_warning";
  }

  return "failed_assertion";
}

function summarizeEvidence(evidenceRefs: readonly EvaluationEvidenceRefInput[]) {
  const sourceEvidenceCount = evidenceRefs.filter((ref) => Boolean(ref.sourceId || ref.sourceDocumentId || ref.sourceChunkId)).length;
  const artifactEvidenceCount = evidenceRefs.filter((ref) => Boolean(ref.storagePath)).length;

  return {
    evidenceCount: evidenceRefs.length,
    sourceEvidenceCount,
    artifactEvidenceCount,
  };
}

function guardrailForEvidence(actualOutput: JsonRecord, evidenceCount: number): RecommendedFixGuardrail {
  if (evidenceCount > 0) {
    return "evidence_grounded";
  }

  return hasRunnerOutput(actualOutput) ? "runner_output_only" : "insufficient_evidence";
}

function hasRunnerOutput(actualOutput: JsonRecord) {
  return Boolean(
    stringValue(actualOutput.summary)
    ?? stringValue(actualOutput.actual)
    ?? stringValue(actualOutput.answer)
    ?? stringValue(actualOutput.error)
    ?? (Object.keys(actualOutput).length > 0 ? JSON.stringify(actualOutput) : undefined),
  );
}

function evidenceInstruction(
  guardrail: RecommendedFixGuardrail,
  evidence: { sourceEvidenceCount: number; artifactEvidenceCount: number; evidenceCount: number },
) {
  if (guardrail === "runner_output_only") {
    return "runner output";
  }

  if (evidence.sourceEvidenceCount > 0 && evidence.artifactEvidenceCount > 0) {
    return "source evidence, run output, and artifact";
  }

  if (evidence.sourceEvidenceCount > 0) {
    return "source evidence and run output";
  }

  if (evidence.artifactEvidenceCount > 0) {
    return "runner artifact and run output";
  }

  return "run output";
}

function sourceOwnerPhrase(ownerUserId?: string) {
  return ownerUserId ? `The assertion owner (${ownerUserId})` : "The assigned source owner";
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function boundedText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 3)}...`;
}
