import "server-only";

import { z } from "zod";

import {
  assertionCategories,
  assertionPriorities,
  runnerTypes,
  type AssertionCategory,
  type AssertionPriority,
  type RunnerType,
} from "@/lib/assertions/schema";
import {
  createOpenAIJsonProvider,
  OpenAIResponsesError,
  parseOpenAIJsonPayload,
} from "@/lib/llm/openai-responses";
import { createRadarLlmPromptContract } from "@/lib/llm/prompt-contracts";
import type { RadarSource } from "@/lib/sources/schema";

export const defaultAssertionSuggestionModel = "gpt-5.2";

export type AssertionSuggestionSourceContext = Pick<
  RadarSource,
  "id" | "name" | "description" | "type" | "originUri" | "syncStatus"
> & {
  excerpts: readonly string[];
};

export type SuggestedAssertionDraft = {
  title: string;
  purpose: string;
  expectedBehavior: string;
  category: AssertionCategory;
  priority: AssertionPriority;
  runnerType: RunnerType;
  requiredSourceIds: string[];
  reasoning: string;
};

export type AssertionSuggestionProvider = {
  model: string;
  prompt: {
    id: string;
    version: string;
    task: "generation";
  };
  generate(input: AssertionSuggestionInput): Promise<SuggestedAssertionDraft[]>;
};

export type AssertionSuggestionInput = {
  workspaceName: string;
  sources: readonly AssertionSuggestionSourceContext[];
  maxSuggestions?: number;
};

type OpenAIAssertionSuggestionProviderOptions = {
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
};

const suggestedAssertionDraftSchema = z.object({
  title: z.string().trim().min(4).max(180),
  purpose: z.string().trim().min(8).max(1000),
  expectedBehavior: z.string().trim().min(8).max(2000),
  category: z.enum(assertionCategories),
  priority: z.enum(assertionPriorities),
  runnerType: z.enum(runnerTypes),
  requiredSourceIds: z.array(z.uuid()).max(5),
  reasoning: z.string().trim().min(8).max(1000),
});

const suggestionsResponseSchema = z.object({
  suggestions: z.array(suggestedAssertionDraftSchema).min(1).max(5),
});

export function createOpenAIAssertionSuggestionProvider(
  options: OpenAIAssertionSuggestionProviderOptions = {},
): AssertionSuggestionProvider {
  const provider = createAssertionJsonProvider(options);
  const promptContract = assertionSuggestionPromptContract();

  return {
    model: provider.model,
    prompt: {
      id: promptContract.id,
      version: promptContract.version,
      task: "generation",
    },
    async generate(input) {
      const boundedInput = buildSuggestionPrompt(input);

      try {
        const result = await provider.generateJson({
          contract: promptContract,
          input: boundedInput,
          responseSchema: suggestionsResponseSchema,
        });

        return result.data.suggestions;
      } catch (error) {
        if (error instanceof OpenAIResponsesError) {
          throw new AssertionSuggestionError(error.message);
        }

        throw error;
      }
    },
  };
}

export function parseSuggestionResponse(payload: unknown) {
  return parseOpenAIJsonPayload(payload, suggestionsResponseSchema).suggestions;
}

export function buildSuggestionPrompt(input: AssertionSuggestionInput) {
  const maxSuggestions = Math.min(Math.max(input.maxSuggestions ?? 3, 1), 5);
  const sourceSummaries = input.sources.map((source) => ({
    id: source.id,
    name: source.name,
    type: source.type,
    syncStatus: source.syncStatus,
    originUri: source.originUri,
    description: source.description,
    excerpts: source.excerpts.slice(0, 4).map((excerpt) => excerpt.slice(0, 1200)),
  }));

  return JSON.stringify({
    workspaceName: input.workspaceName,
    maxSuggestions,
    allowedCategories: assertionCategories,
    allowedPriorities: assertionPriorities,
    allowedRunnerTypes: runnerTypes,
    sources: sourceSummaries,
    requirements: [
      "Each suggestion must be a customer-facing business truth Radar can verify.",
      "Use requiredSourceIds from the supplied source ids only.",
      "Prefer Knowledge Runner for policy/docs/support-answer consistency, Journey Runner for customer paths, and Integration Runner for endpoint or handoff checks.",
      "Status is omitted because generated assertions are saved as draft by the server.",
    ],
  });
}

const suggestionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["suggestions"],
  properties: {
    suggestions: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "purpose",
          "expectedBehavior",
          "category",
          "priority",
          "runnerType",
          "requiredSourceIds",
          "reasoning",
        ],
        properties: {
          title: { type: "string", minLength: 4, maxLength: 180 },
          purpose: { type: "string", minLength: 8, maxLength: 1000 },
          expectedBehavior: { type: "string", minLength: 8, maxLength: 2000 },
          category: { type: "string", enum: assertionCategories },
          priority: { type: "string", enum: assertionPriorities },
          runnerType: { type: "string", enum: runnerTypes },
          requiredSourceIds: {
            type: "array",
            maxItems: 5,
            items: { type: "string", format: "uuid" },
          },
          reasoning: { type: "string", minLength: 8, maxLength: 1000 },
        },
      },
    },
  },
} as const;

function createAssertionJsonProvider(options: OpenAIAssertionSuggestionProviderOptions) {
  try {
    return createOpenAIJsonProvider({
      apiKey: options.apiKey,
      model: options.model ?? defaultAssertionSuggestionModel,
      fetcher: options.fetcher,
    });
  } catch (error) {
    if (error instanceof OpenAIResponsesError) {
      throw new AssertionSuggestionError("OpenAI assertion suggestions are not configured.");
    }

    throw error;
  }
}

function assertionSuggestionPromptContract() {
  return createRadarLlmPromptContract({
    id: "assertion_suggestions",
    version: "v1",
    task: "generation",
    instructions:
      "You generate Radar customer-facing business verification assertions. Use only the supplied source context. Return reviewable draft assertions, never active assertions. Do not invent unavailable systems, credentials, or integrations.",
    responseFormat: {
      name: "radar_assertion_suggestions",
      strict: true,
      jsonSchema: suggestionJsonSchema,
    },
    maxOutputTokens: 1800,
  });
}

export class AssertionSuggestionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssertionSuggestionError";
  }
}
