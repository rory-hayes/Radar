import "server-only";

import { createRadarLlmPromptContract } from "@/lib/llm/prompt-contracts";

export const evaluationJudgePromptContract = createRadarLlmPromptContract({
  id: "evaluation_judge",
  version: "v1",
  task: "judging",
  instructions:
    "Judge whether a Radar runner output satisfies a customer-facing business assertion using only supplied assertion, test case, runner output, and evidence context. Return calibrated scores and business-readable reasoning. Do not create critical findings without evidence.",
  responseFormat: {
    name: "radar_evaluation_judgement",
    strict: true,
    jsonSchema: {
      type: "object",
      additionalProperties: false,
      required: ["status", "score", "confidence", "summary", "evidenceNotes", "recommendedFinding"],
      properties: {
        status: { type: "string", enum: ["passed", "warning", "failed", "inconclusive", "error"] },
        score: { type: "number", minimum: 0, maximum: 1 },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        summary: { type: "string", minLength: 8, maxLength: 2000 },
        evidenceNotes: { type: "string", minLength: 8, maxLength: 2000 },
        recommendedFinding: { type: "boolean" },
      },
    },
  },
  maxOutputTokens: 2000,
});

export const evaluationSummaryPromptContract = createRadarLlmPromptContract({
  id: "evaluation_summary",
  version: "v1",
  task: "summarization",
  instructions:
    "Summarize Radar evaluation results for operators who need to understand whether a customer-facing promise is still true. Use only supplied run and evidence context. Keep the summary concise, evidence-backed, and action-oriented.",
  responseFormat: {
    name: "radar_evaluation_summary",
    strict: true,
    jsonSchema: {
      type: "object",
      additionalProperties: false,
      required: ["headline", "summary", "customerImpact", "nextStep"],
      properties: {
        headline: { type: "string", minLength: 4, maxLength: 180 },
        summary: { type: "string", minLength: 8, maxLength: 2000 },
        customerImpact: { type: "string", minLength: 4, maxLength: 1000 },
        nextStep: { type: "string", minLength: 4, maxLength: 1000 },
      },
    },
  },
  maxOutputTokens: 1600,
});

export const recommendedFixPromptContract = createRadarLlmPromptContract({
  id: "recommended_fix",
  version: "v1",
  task: "fix_recommendation",
  instructions:
    "Recommend a concrete fix for a Radar finding using only supplied assertion, evidence, and failure context. Do not invent tools, integrations, credentials, owners, or policies. Return a business-readable fix with clear rationale.",
  responseFormat: {
    name: "radar_recommended_fix",
    strict: true,
    jsonSchema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "recommendation", "rationale", "riskIfIgnored"],
      properties: {
        title: { type: "string", minLength: 4, maxLength: 180 },
        recommendation: { type: "string", minLength: 8, maxLength: 2000 },
        rationale: { type: "string", minLength: 8, maxLength: 2000 },
        riskIfIgnored: { type: "string", minLength: 8, maxLength: 1000 },
      },
    },
  },
  maxOutputTokens: 1600,
});

export const phaseFiveLlmPromptContracts = [
  evaluationJudgePromptContract,
  evaluationSummaryPromptContract,
  recommendedFixPromptContract,
] as const;
