import "server-only";

import {
  abuseLimitEventCreateSchema,
  type AbuseLimitEventCreateInput,
  type AbuseLimitEventType,
} from "@/lib/abuse/schema";
import {
  assertRepositorySuccess,
  jsonRecord,
  type JsonRecord,
  type RadarRepositoryClient,
} from "@/lib/repositories/client";

type AbuseLimitEventRow = {
  id: string;
  workspace_id: string;
  user_id: string | null;
  event_type: AbuseLimitEventType;
  quantity: number;
  metadata: JsonRecord;
  occurred_at: string;
  created_at: string;
};

export type RadarAbuseLimitEvent = {
  id: string;
  workspaceId: string;
  userId?: string;
  eventType: AbuseLimitEventType;
  quantity: number;
  metadata: JsonRecord;
  occurredAt: string;
  createdAt: string;
};

const abuseLimitEventSelect = "id, workspace_id, user_id, event_type, quantity, metadata, occurred_at, created_at";

export async function recordAbuseLimitEvent(
  client: RadarRepositoryClient,
  input: AbuseLimitEventCreateInput,
) {
  const parsedInput = abuseLimitEventCreateSchema.parse(input);
  const { data, error } = await client
    .from("abuse_limit_events")
    .insert({
      workspace_id: parsedInput.workspaceId,
      user_id: parsedInput.userId ?? null,
      event_type: parsedInput.eventType,
      quantity: parsedInput.quantity,
      metadata: parsedInput.metadata,
      occurred_at: parsedInput.occurredAt ?? new Date().toISOString(),
    })
    .select(abuseLimitEventSelect)
    .single<AbuseLimitEventRow>();

  assertRepositorySuccess(error, "Unable to record abuse limit event");
  return data ? mapAbuseLimitEventRow(data) : null;
}

export async function sumAbuseLimitEvents(
  client: RadarRepositoryClient,
  input: {
    eventType: AbuseLimitEventType;
    workspaceId?: string;
    userId?: string;
    since: string;
  },
) {
  let query = client
    .from("abuse_limit_events")
    .select("quantity")
    .eq("event_type", input.eventType)
    .gte("occurred_at", input.since);

  if (input.workspaceId) {
    query = query.eq("workspace_id", input.workspaceId);
  }

  if (input.userId) {
    query = query.eq("user_id", input.userId);
  }

  const { data, error } = await query.returns<Array<{ quantity: number }>>();

  assertRepositorySuccess(error, "Unable to load abuse limit events");
  return (data ?? []).reduce((sum, row) => sum + row.quantity, 0);
}

function mapAbuseLimitEventRow(row: AbuseLimitEventRow): RadarAbuseLimitEvent {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id ?? undefined,
    eventType: row.event_type,
    quantity: row.quantity,
    metadata: jsonRecord(row.metadata),
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  };
}
