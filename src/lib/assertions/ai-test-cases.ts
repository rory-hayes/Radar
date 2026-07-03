import "server-only";

import { z } from "zod";

import {
  testCaseTypes,
  type RadarAssertion,
  type RadarTestCase,
  type TestCaseType,
} from "@/lib/assertions/schema";
import {
  createOpenAIJsonProvider,
  OpenAIResponsesError,
  parseOpenAIJsonPayload,
} from "@/lib/llm/openai-responses";
import { createRadarLlmPromptContract } from "@/lib/llm/prompt-contracts";
import type { RadarSource } from "@/lib/sources/schema";

export const defaultTestCaseSuggestionModel = "gpt-5.2";

export type TestCaseSuggestionSourceContext = Pick<
  RadarSource,
  "id" | "name" | "description" | "type" | "originUri" | "syncStatus"
> & {
  excerpts: readonly string[];
};

export type SuggestedTestCaseDraft = {
  title: string;
  type: TestCaseType;
  inputText: string;
  expectedResult: string;
  coverageNotes: string;
};

export type TestCaseSuggestionInput = {
  assertion: RadarAssertion;
  sources: readonly TestCaseSuggestionSourceContext[];
  existingTestCases: readonly Pick<RadarTestCase, "title" | "type" | "expectedResult">[];
  maxSuggestions?: number;
};

export type TestCaseSuggestionProvider = {
  model: string;
  prompt: {
    id: string;
    version: string;
    task: "generation";
  };
  generate(input: TestCaseSuggestionInput): Promise<SuggestedTestCaseDraft[]>;
};

type OpenAITestCaseSuggestionProviderOptions = {
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
};

const suggestedTestCaseDraftSchema = z.object({
  title: z.string().trim().min(4).max(180),
  type: z.enum(testCaseTypes),
  inputText: z.string().trim().min(4).max(2000),
  expectedResult: z.string().trim().min(8).max(2000),
  coverageNotes: z.string().trim().min(8).max(1000),
});

const suggestionsResponseSchema = z.object({
  testCases: z.array(suggestedTestCaseDraftSchema).min(1).max(5),
});

export function createOpenAITestCaseSuggestionProvider(
  options: OpenAITestCaseSuggestionProviderOptions = {},
): TestCaseSuggestionProvider {
  const provider = createTestCaseJsonProvider(options);
  const promptContract = testCaseSuggestionPromptContract();

  return {
    model: provider.model,
    prompt: {
      id: promptContract.id,
      version: promptContract.version,
      task: "generation",
    },
    async generate(input) {
      try {
        const result = await provider.generateJson({
          contract: promptContract,
          input: buildTestCaseSuggestionPrompt(input),
          responseSchema: suggestionsResponseSchema,
        });

        return result.data.testCases;
      } catch (error) {
        if (error instanceof OpenAIResponsesError) {
          throw new TestCaseSuggestionError(error.message);
        }

        throw error;
      }
    },
  };
}

export function parseTestCaseSuggestionResponse(payload: unknown) {
  return parseOpenAIJsonPayload(payload, suggestionsResponseSchema).testCases;
}

export function buildTestCaseSuggestionPrompt(input: TestCaseSuggestionInput) {
  const maxSuggestions = Math.min(Math.max(input.maxSuggestions ?? 3, 1), 5);

  return JSON.stringify({
    assertion: {
      id: input.assertion.id,
      title: input.assertion.title,
      purpose: input.assertion.purpose,
      expectedBehavior: input.assertion.expectedBehavior,
      category: input.assertion.category,
      runnerType: input.assertion.runnerType,
    },
    maxSuggestions,
    allowedTypes: testCaseTypes,
    linkedSources: input.sources.map((source) => ({
      id: source.id,
      name: source.name,
      type: source.type,
      syncStatus: source.syncStatus,
      originUri: source.originUri,
      description: source.description,
      excerpts: source.excerpts.slice(0, 4).map((excerpt) => excerpt.slice(0, 1200)),
    })),
    existingTestCases: input.existingTestCases.slice(0, 12),
    requirements: [
      "Generate realistic customer questions, journeys, or integration checks.",
      "Each inputText must be directly runnable or understandable by a human reviewer.",
      "Each expectedResult must be grounded in the assertion and supplied source context.",
      "coverageNotes must explain what risk or customer-facing behavior the test covers.",
      "Do not duplicate existing test cases.",
    ],
  });
}

const testCaseSuggestionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["testCases"],
  properties: {
    testCases: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "type", "inputText", "expectedResult", "coverageNotes"],
        properties: {
          title: { type: "string", minLength: 4, maxLength: 180 },
          type: { type: "string", enum: testCaseTypes },
          inputText: { type: "string", minLength: 4, maxLength: 2000 },
          expectedResult: { type: "string", minLength: 8, maxLength: 2000 },
          coverageNotes: { type: "string", minLength: 8, maxLength: 1000 },
        },
      },
    },
  },
} as const;

function createTestCaseJsonProvider(options: OpenAITestCaseSuggestionProviderOptions) {
  try {
    return createOpenAIJsonProvider({
      apiKey: options.apiKey,
      model: options.model ?? defaultTestCaseSuggestionModel,
      fetcher: options.fetcher,
    });
  } catch (error) {
    if (error instanceof OpenAIResponsesError) {
      throw new TestCaseSuggestionError("OpenAI test case suggestions are not configured.");
    }

    throw error;
  }
}

function testCaseSuggestionPromptContract() {
  return createRadarLlmPromptContract({
    id: "test_case_suggestions",
    version: "v1",
    task: "generation",
    instructions:
      "You generate Radar test cases for customer-facing business verification. Use only the supplied assertion and source context. Return draft, user-editable test cases. Do not invent unavailable systems, credentials, policies, or integrations.",
    responseFormat: {
      name: "radar_test_case_suggestions",
      strict: true,
      jsonSchema: testCaseSuggestionJsonSchema,
    },
    maxOutputTokens: 1800,
  });
}

export class TestCaseSuggestionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TestCaseSuggestionError";
  }
}
