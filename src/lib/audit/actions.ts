export const auditActions = [
  "auth.signed_in",
  "auth.signed_out",
  "workspace.created",
  "workspace.updated",
  "workspace.member_added",
  "workspace.member_updated",
  "source.created",
  "source.updated",
  "source.deleted",
  "assertion.created",
  "assertion.updated",
  "assertion.deleted",
  "run.rerun_requested",
  "finding.resolved",
  "finding.updated",
] as const;

export const auditResourceTypes = [
  "auth_session",
  "workspace",
  "workspace_member",
  "source",
  "assertion",
  "run",
  "finding",
] as const;

export type AuditAction = (typeof auditActions)[number];
export type AuditResourceType = (typeof auditResourceTypes)[number];
