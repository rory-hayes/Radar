import "server-only";

import { createHash } from "node:crypto";

import { startObservation, type LangfuseGeneration } from "@langfuse/tracing";

import { serverEnv } from "@/lib/env/server";
import type { RadarLlmPromptContract, RadarLlmPromptLogMetadata } from "@/lib/llm/prompt-contracts";

export type RadarLlmUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type RadarLlmTraceMetadata = {
  traceStatus: "skipped" | "recorded" | "failed";
  traceId?: string;
  observationId?: string;
  latencyMs: number;
  costTracking: "langfuse_model_usage_inference";
};

export type RadarLlmGenerationResult<TOutput> = {
  data: TOutput;
  usage?: RadarLlmUsage;
  outputFingerprint?: string;
};

export async function traceRadarLlmGeneration<TOutput>(
  input: {
    provider: "openai";
    model: string;
    contract: RadarLlmPromptContract;
    promptMetadata: RadarLlmPromptLogMetadata;
  },
  operation: () => Promise<RadarLlmGenerationResult<TOutput>>,
): Promise<{ result: RadarLlmGenerationResult<TOutput>; trace: RadarLlmTraceMetadata }> {
  const startedAt = Date.now();
  const generation = startLangfuseGeneration(input);

  try {
    const result = await operation();
    const latencyMs = Date.now() - startedAt;

    generation
      ?.update({
        output: {
          outputFingerprint: result.outputFingerprint,
        },
        usageDetails: normalizeUsageDetails(result.usage),
        metadata: {
          ...baseTraceMetadata(input),
          latencyMs,
          traceStatus: "recorded",
          totalTokens: result.usage?.totalTokens,
        },
      })
      .end();

    return {
      result,
      trace: buildTraceMetadata(generation, latencyMs, generation ? "recorded" : "skipped"),
    };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;

    generation
      ?.update({
        level: "ERROR",
        statusMessage: error instanceof Error ? error.name : "UnknownError",
        metadata: {
          ...baseTraceMetadata(input),
          latencyMs,
          traceStatus: "failed",
          failureType: error instanceof Error ? error.name : "UnknownError",
        },
      })
      .end();

    throw error;
  }
}

export function fingerprintLlmTraceOutput(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function startLangfuseGeneration(input: {
  provider: "openai";
  model: string;
  contract: RadarLlmPromptContract;
  promptMetadata: RadarLlmPromptLogMetadata;
}) {
  if (!serverEnv.LANGFUSE_PUBLIC_KEY || !serverEnv.LANGFUSE_SECRET_KEY) {
    return undefined;
  }

  try {
    return startObservation(
      `radar.llm.${input.contract.id}`,
      {
        input: {
          inputFingerprint: input.promptMetadata.inputFingerprint,
          promptId: input.promptMetadata.promptId,
          promptVersion: input.promptMetadata.promptVersion,
          task: input.promptMetadata.task,
          responseFormat: input.promptMetadata.responseFormat,
        },
        model: input.model,
        version: input.contract.version,
        metadata: {
          ...baseTraceMetadata(input),
          traceStatus: "recorded",
        },
      },
      { asType: "generation" },
    );
  } catch {
    return undefined;
  }
}

function baseTraceMetadata(input: {
  provider: "openai";
  model: string;
  contract: RadarLlmPromptContract;
  promptMetadata: RadarLlmPromptLogMetadata;
}) {
  return {
    app: "radar",
    provider: input.provider,
    model: input.model,
    promptId: input.promptMetadata.promptId,
    promptVersion: input.promptMetadata.promptVersion,
    task: input.promptMetadata.task,
    responseFormat: input.promptMetadata.responseFormat,
    inputFingerprint: input.promptMetadata.inputFingerprint,
    costTracking: "langfuse_model_usage_inference",
  };
}

function buildTraceMetadata(
  generation: LangfuseGeneration | undefined,
  latencyMs: number,
  traceStatus: RadarLlmTraceMetadata["traceStatus"],
): RadarLlmTraceMetadata {
  return {
    traceStatus,
    traceId: generation?.traceId,
    observationId: generation?.id,
    latencyMs,
    costTracking: "langfuse_model_usage_inference",
  };
}

function normalizeUsageDetails(usage: RadarLlmUsage | undefined) {
  if (!usage) {
    return undefined;
  }

  return {
    input: usage.inputTokens ?? 0,
    output: usage.outputTokens ?? 0,
    total: usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
  };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value) ?? "undefined";
}
