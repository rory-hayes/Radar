import "server-only";

import { z } from "zod";

import { type RadarAssertion, type RadarTestCase } from "@/lib/assertions/schema";
import { type TestCaseResultStatus } from "@/lib/evaluation/schema";
import { evaluationJudgePromptContract } from "@/lib/evaluation/llm-prompt-contracts";
import {
  createOpenAIJsonProvider,
  OpenAIResponsesError,
  parseOpenAIJsonPayload,
  type OpenAIJsonProvider,
  type OpenAIJsonProviderOptions,
} from "@/lib/llm/openai-responses";
import type { RadarLlmPromptLogMetadata } from "@/lib/llm/prompt-contracts";

export const hybridRubricVersion = "rad-056";

export const hybridRubricDimensionIds = [
  "source_grounding",
  "contradiction_detection",
  "completeness",
  "refusal_behaviour",
  "citation_validity",
  "policy_consistency",
] as const;

export type HybridRubricDimensionId = (typeof hybridRubricDimensionIds)[number];

export type HybridRubricEvidenceSnippet = {
  excerpt: string;
  citation?: string;
  score?: number;
};

export type HybridEvaluationInput = {
  assertion: Pick<RadarAssertion, "id" | "title" | "purpose" | "expectedBehavior" | "category" | "priority">;
  testCase: Pick<RadarTestCase, "id" | "title" | "input" | "expectedResult">;
  actualOutput: Record<string, unknown>;
  evidence: readonly HybridRubricEvidenceSnippet[];
  evidenceRefCount?: number;
};

export type HybridRubricDimensionScore = {
  id: HybridRubricDimensionId;
  label: string;
  score: number;
  weight: number;
  summary: string;
};

export type HybridEvaluatorJudgeInput = HybridEvaluationInput & {
  actualAnswer: string;
  deterministicScore: number;
  dimensions: readonly HybridRubricDimensionScore[];
};

export type HybridEvaluatorJudgeResult = {
  status: Exclude<TestCaseResultStatus, "skipped">;
  score: number;
  confidence: number;
  summary: string;
  evidenceNotes: string;
  recommendedFinding: boolean;
  metadata?: RadarLlmPromptLogMetadata;
};

export type HybridEvaluatorJudgeProvider = {
  judge(input: HybridEvaluatorJudgeInput): Promise<HybridEvaluatorJudgeResult>;
};

export type HybridEvaluationOptions = {
  judgeProvider?: HybridEvaluatorJudgeProvider;
};

export type HybridEvaluationResult = {
  rubricVersion: string;
  status: Exclude<TestCaseResultStatus, "skipped">;
  score: number;
  confidence: number;
  summary: string;
  evidenceNotes: string;
  recommendedFinding: boolean;
  deterministicScore: number;
  llmJudge?: HybridEvaluatorJudgeResult;
  dimensions: readonly HybridRubricDimensionScore[];
};

const judgeResponseSchema = z.object({
  status: z.enum(["passed", "warning", "failed", "inconclusive", "error"]),
  score: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  summary: z.string().trim().min(8).max(2000),
  evidenceNotes: z.string().trim().min(8).max(2000),
  recommendedFinding: z.boolean(),
});

const dimensionLabels: Record<HybridRubricDimensionId, string> = {
  source_grounding: "Source grounding",
  contradiction_detection: "Contradiction detection",
  completeness: "Completeness",
  refusal_behaviour: "Refusal behaviour",
  citation_validity: "Citation validity",
  policy_consistency: "Policy consistency",
};

const dimensionWeights: Record<HybridRubricDimensionId, number> = {
  source_grounding: 0.24,
  contradiction_detection: 0.2,
  completeness: 0.18,
  refusal_behaviour: 0.12,
  citation_validity: 0.12,
  policy_consistency: 0.14,
};

export async function evaluateKnowledgeAnswer(
  input: HybridEvaluationInput,
  options: HybridEvaluationOptions = {},
): Promise<HybridEvaluationResult> {
  const actualAnswer = actualAnswerFromOutput(input.actualOutput);

  if (!actualAnswer) {
    return errorEvaluation(input, "Knowledge Runner did not capture an answer to evaluate.");
  }

  const dimensions = scoreRubricDimensions(input, actualAnswer);
  const deterministicScore = weightedScore(dimensions);
  const judge = options.judgeProvider
    ? await options.judgeProvider.judge({
        ...input,
        actualAnswer,
        deterministicScore,
        dimensions,
      })
    : undefined;
  const evidenceCount = input.evidenceRefCount ?? input.evidence.length;
  const blendedScore = judge ? clampScore(deterministicScore * 0.65 + judge.score * 0.35) : deterministicScore;
  const confidence = blendedConfidence(input, dimensions, judge);
  const status = statusFromScore(blendedScore, evidenceCount, judge?.status);
  const evidenceNotes = judge?.evidenceNotes ?? deterministicEvidenceNotes(input, dimensions);

  return {
    rubricVersion: hybridRubricVersion,
    status,
    score: blendedScore,
    confidence,
    summary: judge?.summary ?? deterministicSummary(status, blendedScore, dimensions),
    evidenceNotes,
    recommendedFinding: shouldRecommendFinding(status, evidenceCount, confidence, judge?.recommendedFinding),
    deterministicScore,
    llmJudge: judge,
    dimensions,
  };
}

export function createOpenAIHybridEvaluatorJudgeProvider(
  options: OpenAIJsonProviderOptions = {},
): HybridEvaluatorJudgeProvider {
  const provider = createOpenAIJsonProvider(options);

  return createHybridEvaluatorJudgeProvider(provider);
}

export function createHybridEvaluatorJudgeProvider(provider: OpenAIJsonProvider): HybridEvaluatorJudgeProvider {
  return {
    async judge(input) {
      try {
        const result = await provider.generateJson({
          contract: evaluationJudgePromptContract,
          input: buildEvaluationJudgePrompt(input),
          responseSchema: judgeResponseSchema,
        });

        return {
          ...result.data,
          metadata: result.metadata,
        };
      } catch (error) {
        if (error instanceof OpenAIResponsesError) {
          throw new HybridEvaluatorError(error.message);
        }

        throw error;
      }
    },
  };
}

export function parseHybridJudgeResponse(payload: unknown) {
  return parseOpenAIJsonPayload(payload, judgeResponseSchema);
}

export function buildEvaluationJudgePrompt(input: HybridEvaluatorJudgeInput) {
  return JSON.stringify({
    rubricVersion: hybridRubricVersion,
    assertion: input.assertion,
    testCase: {
      id: input.testCase.id,
      title: input.testCase.title,
      input: input.testCase.input,
      expectedResult: input.testCase.expectedResult,
    },
    actualAnswer: boundedText(input.actualAnswer, 8000),
    deterministicScore: input.deterministicScore,
    dimensions: input.dimensions,
    evidence: input.evidence.slice(0, 8).map((item) => ({
      excerpt: boundedText(item.excerpt, 1600),
      citation: item.citation,
      score: item.score,
    })),
    requirements: [
      "Use only the supplied assertion, expected result, actual answer, and evidence.",
      "Do not recommend a finding when there is no supporting evidence.",
      "Score source grounding, contradiction, completeness, refusal behaviour, citation validity, and policy consistency.",
      "Return business-readable reasoning for an operator, not low-level model traces.",
    ],
  });
}

export function actualAnswerFromOutput(actualOutput: Record<string, unknown>) {
  const response = jsonObject(actualOutput.response);

  for (const value of [response.answer, actualOutput.answer, actualOutput.text, actualOutput.output]) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function scoreRubricDimensions(
  input: HybridEvaluationInput,
  actualAnswer: string,
): readonly HybridRubricDimensionScore[] {
  const answerTokens = contentTokens(actualAnswer);
  const expectedTokens = contentTokens(`${input.assertion.expectedBehavior} ${input.testCase.expectedResult}`);
  const evidenceText = input.evidence.map((item) => item.excerpt).join("\n\n");
  const evidenceTokens = contentTokens(evidenceText);
  const evidenceCount = input.evidenceRefCount ?? input.evidence.length;
  const sourceGrounding = evidenceCount === 0 ? 0 : tokenOverlap(answerTokens, evidenceTokens);
  const completeness = tokenOverlap(answerTokens, expectedTokens);
  const contradiction = contradictionScore(actualAnswer, evidenceText, input.testCase.expectedResult);
  const refusal = refusalScore(actualAnswer, input.testCase.expectedResult);
  const citation = citationScore(input);
  const policy = clampScore(sourceGrounding * 0.55 + contradiction * 0.3 + completeness * 0.15);

  return [
    dimensionScore("source_grounding", sourceGrounding, groundingSummary(sourceGrounding, evidenceCount)),
    dimensionScore("contradiction_detection", contradiction, contradictionSummary(contradiction)),
    dimensionScore("completeness", completeness, completenessSummary(completeness)),
    dimensionScore("refusal_behaviour", refusal, refusalSummary(refusal)),
    dimensionScore("citation_validity", citation, citationSummary(citation, evidenceCount)),
    dimensionScore("policy_consistency", policy, policySummary(policy)),
  ];
}

function dimensionScore(
  id: HybridRubricDimensionId,
  score: number,
  summary: string,
): HybridRubricDimensionScore {
  return {
    id,
    label: dimensionLabels[id],
    score: clampScore(score),
    weight: dimensionWeights[id],
    summary,
  };
}

function weightedScore(dimensions: readonly HybridRubricDimensionScore[]) {
  const weightTotal = dimensions.reduce((sum, dimension) => sum + dimension.weight, 0);

  if (weightTotal <= 0) {
    return 0;
  }

  return clampScore(dimensions.reduce((sum, dimension) => sum + dimension.score * dimension.weight, 0) / weightTotal);
}

function blendedConfidence(
  input: HybridEvaluationInput,
  dimensions: readonly HybridRubricDimensionScore[],
  judge: HybridEvaluatorJudgeResult | undefined,
) {
  const evidenceCount = input.evidenceRefCount ?? input.evidence.length;
  const evidenceConfidence = evidenceCount > 0 ? Math.min(1, 0.45 + evidenceCount * 0.08) : 0.25;
  const deterministicConfidence = clampScore(evidenceConfidence * 0.6 + spreadConfidence(dimensions) * 0.4);

  return judge ? clampScore(deterministicConfidence * 0.7 + judge.confidence * 0.3) : deterministicConfidence;
}

function spreadConfidence(dimensions: readonly HybridRubricDimensionScore[]) {
  const scores = dimensions.map((dimension) => dimension.score);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + (score - average) ** 2, 0) / scores.length;

  return clampScore(1 - Math.sqrt(variance));
}

function statusFromScore(
  score: number,
  evidenceCount: number,
  judgeStatus: HybridEvaluatorJudgeResult["status"] | undefined,
): Exclude<TestCaseResultStatus, "skipped"> {
  if (judgeStatus === "error") {
    return "error";
  }

  if (evidenceCount === 0) {
    return "inconclusive";
  }

  if (score >= 0.82) {
    return "passed";
  }

  if (score >= 0.62) {
    return "warning";
  }

  return "failed";
}

function shouldRecommendFinding(
  status: Exclude<TestCaseResultStatus, "skipped">,
  evidenceCount: number,
  confidence: number,
  judgeRecommendedFinding: boolean | undefined,
) {
  if (evidenceCount === 0 || confidence < 0.55) {
    return false;
  }

  if (status === "failed") {
    return true;
  }

  return status === "warning" && judgeRecommendedFinding === true;
}

function deterministicEvidenceNotes(
  input: HybridEvaluationInput,
  dimensions: readonly HybridRubricDimensionScore[],
) {
  const evidenceCount = input.evidenceRefCount ?? input.evidence.length;
  const weakest = [...dimensions].sort((left, right) => left.score - right.score)[0];

  if (evidenceCount === 0) {
    return "No source evidence was attached, so Radar cannot make an evidence-backed finding.";
  }

  return `${evidenceCount} evidence reference(s) attached. Weakest rubric dimension: ${weakest.label}.`;
}

function deterministicSummary(
  status: Exclude<TestCaseResultStatus, "skipped">,
  score: number,
  dimensions: readonly HybridRubricDimensionScore[],
) {
  const weakest = [...dimensions].sort((left, right) => left.score - right.score)[0];

  return `Hybrid rubric returned ${status} at ${Math.round(score * 100)}%. Lowest dimension: ${weakest.label}.`;
}

function errorEvaluation(input: HybridEvaluationInput, message: string): HybridEvaluationResult {
  const dimensions = hybridRubricDimensionIds.map((id) => dimensionScore(id, 0, message));

  return {
    rubricVersion: hybridRubricVersion,
    status: "error",
    score: 0,
    confidence: 0,
    summary: message,
    evidenceNotes:
      (input.evidenceRefCount ?? input.evidence.length) > 0
        ? "Evidence was attached but no answer was available to compare."
        : "No evidence or answer was available to compare.",
    recommendedFinding: false,
    deterministicScore: 0,
    dimensions,
  };
}

function contradictionScore(answer: string, evidenceText: string, expectedResult: string) {
  const answerLower = answer.toLowerCase();
  const comparisonLower = `${evidenceText} ${expectedResult}`.toLowerCase();
  const answerNegates = negationPattern.test(answerLower);
  const comparisonAffirms = affirmationPattern.test(comparisonLower);
  const answerAffirms = affirmationPattern.test(answerLower);
  const comparisonNegates = negationPattern.test(comparisonLower);

  if ((answerNegates && comparisonAffirms) || (answerAffirms && comparisonNegates)) {
    return 0.25;
  }

  return 0.85;
}

function refusalScore(answer: string, expectedResult: string) {
  const answerRefuses = refusalPattern.test(answer.toLowerCase());
  const expectedRefusal = refusalPattern.test(expectedResult.toLowerCase()) || /human|escalat|handoff|review/.test(expectedResult.toLowerCase());

  if (expectedRefusal) {
    return answerRefuses || /human|escalat|handoff|review/.test(answer.toLowerCase()) ? 0.9 : 0.45;
  }

  return answerRefuses ? 0.35 : 0.85;
}

function citationScore(input: HybridEvaluationInput) {
  const evidenceCount = input.evidenceRefCount ?? input.evidence.length;

  if (evidenceCount === 0) {
    return 0;
  }

  const citedEvidence = input.evidence.filter((item) => Boolean(item.citation)).length;

  return citedEvidence === 0 ? 0.55 : Math.min(1, 0.7 + citedEvidence * 0.08);
}

function tokenOverlap(answerTokens: Set<string>, comparisonTokens: Set<string>) {
  if (comparisonTokens.size === 0 || answerTokens.size === 0) {
    return 0;
  }

  let matches = 0;

  for (const token of comparisonTokens) {
    if (answerTokens.has(token)) {
      matches += 1;
    }
  }

  return clampScore(matches / Math.min(comparisonTokens.size, Math.max(answerTokens.size, 1)));
}

function contentTokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !stopWords.has(token)),
  );
}

function groundingSummary(score: number, evidenceCount: number) {
  if (evidenceCount === 0) return "No evidence references were available for grounding.";
  return score >= 0.6 ? "Answer substantially overlaps supplied evidence." : "Answer has weak overlap with supplied evidence.";
}

function contradictionSummary(score: number) {
  return score >= 0.8 ? "No direct affirmation/negation conflict detected." : "Possible contradiction detected.";
}

function completenessSummary(score: number) {
  return score >= 0.6 ? "Answer covers much of the expected result." : "Answer appears incomplete against the expected result.";
}

function refusalSummary(score: number) {
  return score >= 0.8 ? "Refusal or escalation behaviour is consistent with expectation." : "Refusal or escalation behaviour may be inconsistent.";
}

function citationSummary(score: number, evidenceCount: number) {
  if (evidenceCount === 0) return "No citations or evidence references were attached.";
  return score >= 0.7 ? "Evidence references include usable citations." : "Evidence references are present but citation detail is thin.";
}

function policySummary(score: number) {
  return score >= 0.7 ? "Answer appears policy-consistent." : "Answer may drift from source policy.";
}

function jsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function boundedText(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

const stopWords = new Set([
  "the",
  "and",
  "for",
  "that",
  "this",
  "with",
  "from",
  "your",
  "you",
  "are",
  "can",
  "must",
  "should",
  "will",
  "not",
]);

const negationPattern = /\b(no|not|never|cannot|can't|won't|isn't|aren't|ineligible|unavailable)\b/i;
const affirmationPattern = /\b(can|eligible|available|allowed|included|supports|must|will|should)\b/i;
const refusalPattern = /\b(can't|cannot|unable|not able|won't|refuse|sorry|escalat|human|handoff|review)\b/i;

export class HybridEvaluatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HybridEvaluatorError";
  }
}
