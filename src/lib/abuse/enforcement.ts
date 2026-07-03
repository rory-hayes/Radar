import "server-only";

import { rulesForAbuseEvent, type AbuseLimitRule } from "@/lib/abuse/limits";
import type { AbuseLimitEventType } from "@/lib/abuse/schema";
import {
  recordAbuseLimitEvent,
  sumAbuseLimitEvents,
  type RadarRepositoryClient,
} from "@/lib/repositories";

export type AbuseLimitDecision =
  | {
      allowed: true;
      checkedRules: readonly AbuseLimitRule[];
    }
  | {
      allowed: false;
      rule: AbuseLimitRule;
      currentUsage: number;
      requestedQuantity: number;
      retryAfterSeconds: number;
      message: string;
    };

export async function getAbuseLimitDecision(input: {
  client: RadarRepositoryClient;
  workspaceId: string;
  userId?: string;
  eventType: AbuseLimitEventType;
  quantity?: number;
  now?: Date;
}): Promise<AbuseLimitDecision> {
  const quantity = input.quantity ?? 1;
  const now = input.now ?? new Date();
  const checkedRules = rulesForAbuseEvent(input.eventType);

  for (const rule of checkedRules) {
    if (rule.scope === "user" && !input.userId) {
      continue;
    }

    const since = new Date(now.getTime() - rule.windowMs).toISOString();
    const currentUsage = await sumAbuseLimitEvents(input.client, {
      eventType: input.eventType,
      workspaceId: rule.scope === "workspace" ? input.workspaceId : undefined,
      userId: rule.scope === "user" ? input.userId : undefined,
      since,
    });

    if (currentUsage + quantity > rule.limit) {
      return {
        allowed: false,
        rule,
        currentUsage,
        requestedQuantity: quantity,
        retryAfterSeconds: Math.ceil(rule.windowMs / 1000),
        message: `Radar rate limit reached: ${rule.label}. Try again later.`,
      };
    }
  }

  return {
    allowed: true,
    checkedRules,
  };
}

export async function checkAndRecordAbuseLimit(input: {
  client: RadarRepositoryClient;
  workspaceId: string;
  userId?: string;
  eventType: AbuseLimitEventType;
  quantity?: number;
  metadata?: Record<string, unknown>;
  now?: Date;
}) {
  const decision = await getAbuseLimitDecision(input);

  if (!decision.allowed) {
    return decision;
  }

  await recordAbuseLimitEvent(input.client, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    eventType: input.eventType,
    quantity: input.quantity ?? 1,
    metadata: input.metadata ?? {},
    occurredAt: (input.now ?? new Date()).toISOString(),
  });

  return decision;
}

export function abuseLimitFailureMessage(decision: Exclude<AbuseLimitDecision, { allowed: true }>) {
  return decision.message;
}
