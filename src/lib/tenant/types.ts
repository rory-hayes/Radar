export type TenantId = string & { readonly __brand: "TenantId" };
export type UserId = string & { readonly __brand: "UserId" };

export type TenantStatus = "active" | "suspended" | "deleted";
export type TenantPlan = "pilot" | "team" | "enterprise";

export interface Tenant {
  id: TenantId;
  slug: string;
  name: string;
  status: TenantStatus;
  plan: TenantPlan;
  dataRegion?: string;
  retentionPolicyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TenantRole =
  | "owner"
  | "admin"
  | "security"
  | "analyst"
  | "agent"
  | "viewer"
  | "billing";

export type Permission =
  | "tenant:read"
  | "tenant:update"
  | "member:read"
  | "member:invite"
  | "member:update"
  | "member:remove"
  | "source:read"
  | "source:write"
  | "source:delete"
  | "playbook:read"
  | "playbook:write"
  | "playbook:approve"
  | "session:start"
  | "session:read"
  | "session:end"
  | "session:delete"
  | "guidance:read"
  | "guidance:write"
  | "review:read"
  | "review:write"
  | "audit:read"
  | "retention:manage"
  | "usage:read"
  | "billing:manage"
  | "settings:manage"
  | "eval:run"
  | "export:create";

export interface TenantMembership {
  tenantId: TenantId;
  userId: UserId;
  role: TenantRole;
  status: "active" | "invited" | "disabled";
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantContext {
  tenantId: TenantId;
  userId: UserId;
  role: TenantRole;
  permissions: readonly Permission[];
}

export interface TenantScopedResource {
  tenantId: TenantId;
}

export interface AccessDecision {
  allowed: boolean;
  reason: "allowed" | "wrong_tenant" | "missing_permission" | "inactive_membership";
  missingPermission?: Permission;
}
