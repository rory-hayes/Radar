import "server-only";

import { z } from "zod";

export const abuseLimitEventTypes = [
  "source_sync",
  "eval_run",
  "ai_call",
  "api_request",
  "file_upload",
  "runner_execution",
] as const;

export type AbuseLimitEventType = (typeof abuseLimitEventTypes)[number];

export const abuseLimitEventCreateSchema = z.object({
  workspaceId: z.uuid(),
  userId: z.uuid().optional(),
  eventType: z.enum(abuseLimitEventTypes),
  quantity: z.number().int().min(1).max(1000).default(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
  occurredAt: z.iso.datetime().optional(),
});

export type AbuseLimitEventCreateInput = z.infer<typeof abuseLimitEventCreateSchema>;
