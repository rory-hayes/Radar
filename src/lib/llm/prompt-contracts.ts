import "server-only";

import { createHash } from "node:crypto";

import { z } from "zod";

export const radarLlmTasks = ["generation", "judging", "summarization", "fix_recommendation"] as const;

export type RadarLlmTask = (typeof radarLlmTasks)[number];

export type RadarLlmPromptContract = {
  id: string;
  version: string;
  task: RadarLlmTask;
  instructions: string;
  responseFormat: {
    name: string;
    strict: true;
    jsonSchema: unknown;
  };
  maxOutputTokens: number;
};

export type RadarLlmPromptLogMetadata = {
  provider: "openai";
  model: string;
  promptId: string;
  promptVersion: string;
  task: RadarLlmTask;
  responseFormat: string;
  inputFingerprint: string;
  requestedAt: string;
};

const promptContractSchema = z.object({
  id: z.string().trim().min(3).max(120).regex(/^[a-z0-9][a-z0-9_.-]*$/),
  version: z.string().trim().min(2).max(80).regex(/^v\d+(\.\d+){0,2}$/),
  task: z.enum(radarLlmTasks),
  instructions: z.string().trim().min(20).max(4000),
  responseFormat: z.object({
    name: z.string().trim().min(3).max(120).regex(/^[a-z0-9][a-z0-9_]*$/),
    strict: z.literal(true),
    jsonSchema: z.unknown(),
  }),
  maxOutputTokens: z.number().int().min(128).max(12000),
});

export function createRadarLlmPromptContract(contract: RadarLlmPromptContract) {
  return promptContractSchema.parse(contract);
}

export function createPromptLogMetadata(input: {
  provider: "openai";
  model: string;
  contract: RadarLlmPromptContract;
  promptInput: string;
  requestedAt?: string;
}): RadarLlmPromptLogMetadata {
  return {
    provider: input.provider,
    model: input.model,
    promptId: input.contract.id,
    promptVersion: input.contract.version,
    task: input.contract.task,
    responseFormat: input.contract.responseFormat.name,
    inputFingerprint: fingerprintPromptInput(input.promptInput),
    requestedAt: input.requestedAt ?? new Date().toISOString(),
  };
}

export function fingerprintPromptInput(promptInput: string) {
  return createHash("sha256").update(promptInput).digest("hex");
}
