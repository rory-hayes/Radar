import type { TenantId, UserId } from "@/lib/tenant";

export type UsageMeter =
  | "realtime.transcription.seconds"
  | "realtime.client_secret.created"
  | "knowledge.source.uploaded_bytes"
  | "retrieval.query.count"
  | "guidance.card.generated"
  | "review.export.created";

export interface UsageLedgerEntry {
  id?: string;
  tenantId: TenantId;
  meter: UsageMeter;
  quantity: number;
  unit: "seconds" | "bytes" | "count";
  occurredAt: Date;
  idempotencyKey: string;
  actorUserId?: UserId;
  source:
    | { type: "session"; id: string }
    | { type: "source"; id: string }
    | { type: "job"; id: string }
    | { type: "api_request"; id: string };
  metadata?: Record<string, string | number | boolean | null>;
}

export interface UsageLedgerSummary {
  tenantId: TenantId;
  meter: UsageMeter;
  quantity: number;
  unit: UsageLedgerEntry["unit"];
  periodStart: Date;
  periodEnd: Date;
}

export interface UsageLedgerQuery {
  tenantId: TenantId;
  meter?: UsageMeter;
  periodStart: Date;
  periodEnd: Date;
}

export interface UsageLedger {
  record(entry: UsageLedgerEntry): Promise<UsageLedgerEntry>;
  summarize(query: UsageLedgerQuery): Promise<readonly UsageLedgerSummary[]>;
}

export function makeUsageIdempotencyKey(
  entry: Pick<UsageLedgerEntry, "tenantId" | "meter" | "source" | "occurredAt">,
): string {
  return [
    entry.tenantId,
    entry.meter,
    entry.source.type,
    entry.source.id,
    entry.occurredAt.toISOString(),
  ].join(":");
}
