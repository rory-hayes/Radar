import type { AuditActor } from "@/lib/audit";
import type { TenantId } from "@/lib/tenant";

export type RetentionSubject =
  | "transcript_segments"
  | "sessions"
  | "guidance_cards"
  | "review_exports"
  | "source_files"
  | "usage_ledger";

export interface RetentionPolicy {
  id: string;
  tenantId: TenantId;
  rawAudioStorage: "disabled" | "explicit_opt_in";
  transcriptRetentionDays: number;
  sessionRetentionDays: number;
  guidanceRetentionDays: number;
  exportRetentionDays: number;
  sourceRetentionDays: number;
  usageLedgerRetentionDays: number;
  auditRetentionDays: number;
  updatedAt: Date;
  updatedBy: AuditActor;
}

export interface RetentionJobContract {
  id: string;
  tenantId: TenantId;
  policyId: string;
  subject: RetentionSubject;
  cutoff: Date;
  dryRun: boolean;
  requestedAt: Date;
  requestedBy: AuditActor;
}

export type DeletionSubject =
  | "tenant"
  | "user"
  | "source"
  | "session"
  | "review_export";

export interface DeletionRequestContract {
  id: string;
  tenantId: TenantId;
  subject: DeletionSubject;
  subjectId: string;
  mode: "soft_delete" | "hard_delete";
  reason: string;
  requestedAt: Date;
  requestedBy: AuditActor;
  executeAfter: Date;
}

export interface DataLifecycleJobResult {
  jobId: string;
  tenantId: TenantId;
  affectedRecordCount: number;
  completedAt: Date;
  errors: readonly string[];
}

export interface DataLifecycleJobRunner {
  planRetentionSweep(
    policy: RetentionPolicy,
    subject: RetentionSubject,
    requestedBy: AuditActor,
    options?: { dryRun?: boolean; now?: Date },
  ): RetentionJobContract;
  requestDeletion(request: DeletionRequestContract): Promise<void>;
  completeRetentionJob(job: RetentionJobContract): Promise<DataLifecycleJobResult>;
}
