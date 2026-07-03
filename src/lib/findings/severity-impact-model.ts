import "server-only";

import type { RadarAssertion, RadarTestCase, RunnerType } from "@/lib/assertions/schema";
import type { FindingSeverity, RadarFinding } from "@/lib/findings/schema";
import type { RadarTestCaseResult, TestCaseResultStatus } from "@/lib/evaluation/schema";
import type { JsonRecord } from "@/lib/repositories";

export const severityImpactModelVersion = "rad-075";

export type SeverityImpactInput = {
  assertion: RadarAssertion;
  testCase: RadarTestCase;
  result: RadarTestCaseResult;
  repeatCount: number;
};

export type SeverityImpactAssessment = {
  severity: FindingSeverity;
  customerImpact: string;
  impactLevel: "low" | "moderate" | "high" | "critical";
  repeatCount: number;
  factors: {
    assertionPriority: RadarAssertion["priority"];
    resultStatus: TestCaseResultStatus;
    runnerType: RunnerType;
    confidence: number;
    customerFacingSignal: boolean;
    affectedJourneySignal: boolean;
    score: number;
  };
};

const customerFacingTerms = [
  "billing",
  "checkout",
  "customer",
  "email",
  "invoice",
  "login",
  "onboarding",
  "payment",
  "pricing",
  "refund",
  "signup",
  "support",
  "ticket",
  "trial",
];

export function assessSeverityAndImpact(input: SeverityImpactInput): SeverityImpactAssessment {
  const confidence = boundedConfidence(input.result.confidence ?? input.result.score ?? 0.65);
  const customerFacingSignal = hasCustomerFacingSignal(input);
  const affectedJourneySignal = input.result.runnerType === "journey";
  const score = riskScore({
    assertionPriority: input.assertion.priority,
    status: input.result.status,
    runnerType: input.result.runnerType,
    confidence,
    repeatCount: input.repeatCount,
    customerFacingSignal,
    affectedJourneySignal,
    actualOutput: input.result.actualOutput,
  });
  const severity = severityFromScore(score, input.result.status);
  const impactLevel = impactLevelFromSeverity(severity);

  return {
    severity,
    customerImpact: boundedText(customerImpactSummary(input, { confidence, customerFacingSignal, affectedJourneySignal, severity }), 2000),
    impactLevel,
    repeatCount: input.repeatCount,
    factors: {
      assertionPriority: input.assertion.priority,
      resultStatus: input.result.status,
      runnerType: input.result.runnerType,
      confidence,
      customerFacingSignal,
      affectedJourneySignal,
      score,
    },
  };
}

export function nextFindingRepeatCount(existing: RadarFinding | null | undefined) {
  const repeatCount = numberFromMetadata(existing?.metadata, "repeatCount");
  return Math.max(1, repeatCount + 1);
}

function riskScore(input: {
  assertionPriority: RadarAssertion["priority"];
  status: TestCaseResultStatus;
  runnerType: RunnerType;
  confidence: number;
  repeatCount: number;
  customerFacingSignal: boolean;
  affectedJourneySignal: boolean;
  actualOutput: JsonRecord;
}) {
  let score = priorityScore(input.assertionPriority);

  if (input.status === "failed") score += 2;
  if (input.status === "warning") score += 0.5;
  if (input.runnerType === "journey" || input.runnerType === "integration") score += 1;
  if (input.confidence >= 0.85) score += 1;
  if (input.confidence < 0.5) score -= 1;
  if (input.repeatCount >= 5) score += 2;
  else if (input.repeatCount >= 3) score += 1;
  if (input.customerFacingSignal) score += 1;
  if (input.affectedJourneySignal) score += 1;
  if (hasExplicitBlocker(input.actualOutput)) score += 1;

  return Math.max(0, score);
}

function severityFromScore(score: number, status: TestCaseResultStatus): FindingSeverity {
  if (status === "warning" && score < 7) {
    return score >= 4 ? "medium" : "low";
  }

  if (score >= 8) return "critical";
  if (score >= 6) return "high";
  if (score >= 3) return "medium";
  return "low";
}

function priorityScore(priority: RadarAssertion["priority"]) {
  const scores: Record<RadarAssertion["priority"], number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return scores[priority];
}

function impactLevelFromSeverity(severity: FindingSeverity): SeverityImpactAssessment["impactLevel"] {
  const levels: Record<FindingSeverity, SeverityImpactAssessment["impactLevel"]> = {
    critical: "critical",
    high: "high",
    medium: "moderate",
    low: "low",
  };

  return levels[severity];
}

function customerImpactSummary(
  input: SeverityImpactInput,
  assessment: {
    confidence: number;
    customerFacingSignal: boolean;
    affectedJourneySignal: boolean;
    severity: FindingSeverity;
  },
) {
  const repeatText = input.repeatCount > 1
    ? `This failure has repeated ${input.repeatCount} times.`
    : "This is the first captured occurrence.";
  const confidenceText = `${Math.round(assessment.confidence * 100)}% confidence`;
  const journeyText = assessment.affectedJourneySignal
    ? "It affects a customer journey check."
    : `It affects a ${input.result.runnerType} check.`;
  const signalText = assessment.customerFacingSignal
    ? "Customer-facing terms were detected in the assertion, test case, or output."
    : "No extra customer-facing keyword signal was detected beyond the assertion itself.";

  return `${titleize(assessment.severity)} risk: ${statusLabel(input.result.status)} on ${input.assertion.category} assertion "${input.assertion.title}" may affect customers attempting "${input.testCase.title}". ${journeyText} ${repeatText} ${confidenceText}. ${signalText}`;
}

function hasCustomerFacingSignal(input: SeverityImpactInput) {
  const text = [
    input.assertion.title,
    input.assertion.purpose,
    input.assertion.expectedBehavior,
    input.testCase.title,
    input.testCase.expectedResult,
    JSON.stringify(input.result.actualOutput),
  ].join(" ").toLowerCase();

  return customerFacingTerms.some((term) => text.includes(term));
}

function hasExplicitBlocker(actualOutput: JsonRecord) {
  const text = JSON.stringify(actualOutput).toLowerCase();
  return /blocked|broken|failed|missing|timeout|unavailable|not found|error/.test(text);
}

function numberFromMetadata(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || !(key in metadata)) {
    return 0;
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : 0;
}

function statusLabel(status: TestCaseResultStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function titleize(value: string) {
  return value
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function boundedConfidence(value: number) {
  return Math.min(1, Math.max(0, value));
}

function boundedText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 3)}...`;
}
