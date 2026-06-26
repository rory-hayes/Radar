import type { TenantId, UserId } from "@/lib/tenant";

export type AuditActor =
  | {
      type: "user";
      userId: UserId;
      tenantId: TenantId;
    }
  | {
      type: "service";
      serviceName: string;
      tenantId?: TenantId;
    }
  | {
      type: "system";
      tenantId?: TenantId;
    };

export type AuditEventType =
  | "tenant.created"
  | "tenant.updated"
  | "member.invited"
  | "member.updated"
  | "source.created"
  | "source.deleted"
  | "playbook.updated"
  | "playbook.approved"
  | "session.started"
  | "session.ended"
  | "session.deleted"
  | "guidance.generated"
  | "review.updated"
  | "export.created"
  | "retention.policy_updated"
  | "retention.job_planned"
  | "deletion.requested"
  | "deletion.completed"
  | "usage.recorded"
  | "secret.access_denied";

export type AuditOutcome = "success" | "denied" | "failed";
export type AuditSource = "web" | "extension" | "api" | "job";

export interface AuditEntity {
  type:
    | "tenant"
    | "member"
    | "source"
    | "playbook"
    | "session"
    | "guidance_card"
    | "review"
    | "export"
    | "retention_policy"
    | "usage_ledger";
  id: string;
}

export interface AuditEventMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

export interface AuditEventInput {
  type: AuditEventType;
  actor: AuditActor;
  tenantId: TenantId;
  source: AuditSource;
  outcome: AuditOutcome;
  entity?: AuditEntity;
  requestId?: string;
  metadata?: AuditEventMetadata;
  occurredAt?: Date;
}

export interface AuditEvent extends AuditEventInput {
  id: string;
  occurredAt: Date;
}

export interface AuditEventWriter {
  write(event: AuditEventInput): Promise<AuditEvent>;
}
