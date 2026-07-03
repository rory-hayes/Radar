import "server-only";

import type { RunnerType } from "@/lib/assertions/schema";
import type { AbuseLimitEventType } from "@/lib/abuse/schema";

const minuteMs = 60_000;
const hourMs = 60 * minuteMs;

export type AbuseLimitScope = "workspace" | "user";

export type AbuseLimitRule = {
  id: string;
  eventType: AbuseLimitEventType;
  scope: AbuseLimitScope;
  limit: number;
  windowMs: number;
  label: string;
};

export const abuseLimitRules = [
  {
    id: "source_sync_workspace_hour",
    eventType: "source_sync",
    scope: "workspace",
    limit: 30,
    windowMs: hourMs,
    label: "source syncs per workspace per hour",
  },
  {
    id: "source_sync_user_hour",
    eventType: "source_sync",
    scope: "user",
    limit: 12,
    windowMs: hourMs,
    label: "source syncs per user per hour",
  },
  {
    id: "eval_run_workspace_hour",
    eventType: "eval_run",
    scope: "workspace",
    limit: 60,
    windowMs: hourMs,
    label: "evaluation runs per workspace per hour",
  },
  {
    id: "eval_run_user_hour",
    eventType: "eval_run",
    scope: "user",
    limit: 20,
    windowMs: hourMs,
    label: "evaluation runs per user per hour",
  },
  {
    id: "ai_call_workspace_hour",
    eventType: "ai_call",
    scope: "workspace",
    limit: 40,
    windowMs: hourMs,
    label: "AI calls per workspace per hour",
  },
  {
    id: "ai_call_user_hour",
    eventType: "ai_call",
    scope: "user",
    limit: 10,
    windowMs: hourMs,
    label: "AI calls per user per hour",
  },
  {
    id: "api_request_workspace_minute",
    eventType: "api_request",
    scope: "workspace",
    limit: 180,
    windowMs: minuteMs,
    label: "API requests per workspace per minute",
  },
  {
    id: "api_request_user_minute",
    eventType: "api_request",
    scope: "user",
    limit: 90,
    windowMs: minuteMs,
    label: "API requests per user per minute",
  },
  {
    id: "file_upload_workspace_hour",
    eventType: "file_upload",
    scope: "workspace",
    limit: 30,
    windowMs: hourMs,
    label: "file uploads per workspace per hour",
  },
  {
    id: "file_upload_user_hour",
    eventType: "file_upload",
    scope: "user",
    limit: 10,
    windowMs: hourMs,
    label: "file uploads per user per hour",
  },
  {
    id: "runner_execution_workspace_hour",
    eventType: "runner_execution",
    scope: "workspace",
    limit: 80,
    windowMs: hourMs,
    label: "runner executions per workspace per hour",
  },
  {
    id: "runner_execution_user_hour",
    eventType: "runner_execution",
    scope: "user",
    limit: 30,
    windowMs: hourMs,
    label: "runner executions per user per hour",
  },
] as const satisfies readonly AbuseLimitRule[];

export const abusePayloadLimits = {
  uploadedDocumentMaxBytes: 10 * 1024 * 1024,
  manualTextMaxCharacters: 50_000,
  evidenceRetrievalQueryMaxCharacters: 4_000,
  knowledgeEndpointResponseMaxCharacters: 50_000,
} as const;

export const runnerDurationLimits = {
  knowledgeTargetTimeoutMs: 20_000,
  evaluationJobTimeoutMs: 5 * minuteMs,
  byRunnerType: {
    knowledge: 60_000,
    journey: 90_000,
    integration: 60_000,
  },
} as const satisfies {
  knowledgeTargetTimeoutMs: number;
  evaluationJobTimeoutMs: number;
  byRunnerType: Record<RunnerType, number>;
};

export function rulesForAbuseEvent(eventType: AbuseLimitEventType) {
  return abuseLimitRules.filter((rule) => rule.eventType === eventType);
}
