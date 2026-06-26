import "server-only";

import { randomUUID } from "crypto";

import { redactForLog } from "@/lib/security/redaction";
import type { AuditEvent, AuditEventInput, AuditEventWriter } from "./events";

export function buildAuditEvent(input: AuditEventInput): AuditEvent {
  return {
    ...input,
    id: randomUUID(),
    occurredAt: input.occurredAt ?? new Date(),
    metadata: input.metadata
      ? (redactForLog(input.metadata) as AuditEvent["metadata"])
      : undefined,
  };
}

export function createAuditEventService(writeEvent: AuditEventWriter["write"]) {
  return {
    write(event: AuditEventInput): Promise<AuditEvent> {
      return writeEvent(event);
    },
  } satisfies AuditEventWriter;
}

export function createNoopAuditEventWriter(): AuditEventWriter {
  return {
    async write(event: AuditEventInput): Promise<AuditEvent> {
      return buildAuditEvent(event);
    },
  };
}
