import "server-only";

import { z } from "zod";

import { serverEnv } from "@/lib/env/server";
import {
  createPromptLogMetadata,
  type RadarLlmPromptContract,
  type RadarLlmPromptLogMetadata,
} from "@/lib/llm/prompt-contracts";
import {
  fingerprintLlmTraceOutput,
  traceRadarLlmGeneration,
  type RadarLlmTraceMetadata,
} from "@/lib/observability/langfuse";

export const defaultOpenAIResponsesModel = "gpt-5.2";

export type OpenAIJsonProviderOptions = {
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
};

export type OpenAIJsonRequest<TOutput> = {
  contract: RadarLlmPromptContract;
  input: string;
  responseSchema: z.ZodType<TOutput>;
};

export type OpenAIJsonResult<TOutput> = {
  data: TOutput;
  metadata: RadarLlmPromptLogMetadata & {
    langfuse?: RadarLlmTraceMetadata;
    latencyMs?: number;
    usage?: {
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
    };
  };
};

export type OpenAIJsonProvider = {
  provider: "openai";
  model: string;
  generateJson<TOutput>(request: OpenAIJsonRequest<TOutput>): Promise<OpenAIJsonResult<TOutput>>;
};

const openAIResponsesPayloadSchema = z.object({
  output_text: z.string().optional(),
  output: z
    .array(
      z.object({
        type: z.string(),
        content: z
          .array(
            z.object({
              type: z.string(),
              text: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  usage: z
    .object({
      input_tokens: z.number().int().min(0).optional(),
      output_tokens: z.number().int().min(0).optional(),
      total_tokens: z.number().int().min(0).optional(),
    })
    .optional(),
});

export function createOpenAIJsonProvider(options: OpenAIJsonProviderOptions = {}): OpenAIJsonProvider {
  const apiKey = options.apiKey ?? serverEnv.OPENAI_API_KEY;
  const model = options.model ?? defaultOpenAIResponsesModel;
  const fetcher = options.fetcher ?? fetch;

  if (!apiKey) {
    throw new OpenAIResponsesError("OpenAI Responses API is not configured.");
  }

  return {
    provider: "openai",
    model,
    async generateJson<TOutput>(request: OpenAIJsonRequest<TOutput>) {
      const promptMetadata = createPromptLogMetadata({
        provider: "openai",
        model,
        contract: request.contract,
        promptInput: request.input,
      });
      const traced = await traceRadarLlmGeneration(
        {
          provider: "openai",
          model,
          contract: request.contract,
          promptMetadata,
        },
        async () => {
          const response = await fetcher("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              instructions: request.contract.instructions,
              input: request.input,
              max_output_tokens: request.contract.maxOutputTokens,
              text: {
                format: {
                  type: "json_schema",
                  name: request.contract.responseFormat.name,
                  strict: request.contract.responseFormat.strict,
                  schema: request.contract.responseFormat.jsonSchema,
                },
              },
            }),
          });

          if (!response.ok) {
            throw new OpenAIResponsesError(`OpenAI Responses request failed with status ${response.status}.`);
          }

          const payload = openAIResponsesPayloadSchema.parse(await response.json());
          const data = parseOpenAIJsonPayload(payload, request.responseSchema);

          return {
            data,
            usage: normalizeUsage(payload.usage),
            outputFingerprint: fingerprintLlmTraceOutput(data),
          };
        },
      );
      return {
        data: traced.result.data,
        metadata: {
          ...promptMetadata,
          langfuse: traced.trace,
          latencyMs: traced.trace.latencyMs,
          usage: traced.result.usage,
        },
      };
    },
  };
}

export function parseOpenAIJsonPayload<TOutput>(payload: unknown, schema: z.ZodType<TOutput>) {
  const parsedPayload = openAIResponsesPayloadSchema.parse(payload);
  const text = parsedPayload.output_text ?? outputTextFromResponse(parsedPayload.output ?? []);

  if (!text) {
    throw new OpenAIResponsesError("OpenAI Responses payload did not include text output.");
  }

  return schema.parse(JSON.parse(text));
}

function outputTextFromResponse(output: NonNullable<z.infer<typeof openAIResponsesPayloadSchema>["output"]>) {
  return output
    .flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text" && typeof content.text === "string")
    .map((content) => content.text)
    .join("");
}

function normalizeUsage(usage: z.infer<typeof openAIResponsesPayloadSchema>["usage"]) {
  if (!usage) {
    return undefined;
  }

  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    totalTokens: usage.total_tokens,
  };
}

export class OpenAIResponsesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAIResponsesError";
  }
}
