import type {
  AccessDecision,
  Permission,
  TenantContext,
  TenantMembership,
  TenantRole,
  TenantScopedResource,
} from "./types";

export const rolePermissions = {
  owner: [
    "tenant:read",
    "tenant:update",
    "member:read",
    "member:invite",
    "member:update",
    "member:remove",
    "source:read",
    "source:write",
    "source:delete",
    "playbook:read",
    "playbook:write",
    "playbook:approve",
    "session:start",
    "session:read",
    "session:end",
    "session:delete",
    "guidance:read",
    "guidance:write",
    "review:read",
    "review:write",
    "audit:read",
    "retention:manage",
    "usage:read",
    "billing:manage",
    "settings:manage",
    "eval:run",
    "export:create",
  ],
  admin: [
    "tenant:read",
    "tenant:update",
    "member:read",
    "member:invite",
    "member:update",
    "source:read",
    "source:write",
    "source:delete",
    "playbook:read",
    "playbook:write",
    "playbook:approve",
    "session:start",
    "session:read",
    "session:end",
    "guidance:read",
    "guidance:write",
    "review:read",
    "review:write",
    "audit:read",
    "usage:read",
    "settings:manage",
    "eval:run",
    "export:create",
  ],
  security: [
    "tenant:read",
    "member:read",
    "source:read",
    "playbook:read",
    "session:read",
    "review:read",
    "audit:read",
    "retention:manage",
    "usage:read",
    "eval:run",
    "export:create",
  ],
  analyst: [
    "tenant:read",
    "source:read",
    "playbook:read",
    "session:read",
    "guidance:read",
    "review:read",
    "review:write",
    "usage:read",
    "eval:run",
    "export:create",
  ],
  agent: [
    "tenant:read",
    "source:read",
    "playbook:read",
    "session:start",
    "session:read",
    "session:end",
    "guidance:read",
    "review:read",
    "review:write",
  ],
  viewer: [
    "tenant:read",
    "source:read",
    "playbook:read",
    "session:read",
    "guidance:read",
    "review:read",
  ],
  billing: ["tenant:read", "usage:read", "billing:manage"],
} as const satisfies Record<TenantRole, readonly Permission[]>;

export function permissionsForRole(role: TenantRole): readonly Permission[] {
  return rolePermissions[role];
}

export function hasPermission(
  context: Pick<TenantContext, "permissions">,
  permission: Permission,
): boolean {
  return context.permissions.includes(permission);
}

export function buildTenantContext(
  membership: TenantMembership,
): TenantContext | null {
  if (membership.status !== "active") {
    return null;
  }

  return {
    tenantId: membership.tenantId,
    userId: membership.userId,
    role: membership.role,
    permissions: permissionsForRole(membership.role),
  };
}

export function canAccessTenantResource(
  context: TenantContext | null,
  resource: TenantScopedResource,
  permission: Permission,
): AccessDecision {
  if (!context) {
    return { allowed: false, reason: "inactive_membership" };
  }

  if (context.tenantId !== resource.tenantId) {
    return { allowed: false, reason: "wrong_tenant" };
  }

  if (!hasPermission(context, permission)) {
    return {
      allowed: false,
      reason: "missing_permission",
      missingPermission: permission,
    };
  }

  return { allowed: true, reason: "allowed" };
}

export function assertTenantPermission(
  context: TenantContext | null,
  resource: TenantScopedResource,
  permission: Permission,
): asserts context is TenantContext {
  const decision = canAccessTenantResource(context, resource, permission);

  if (!decision.allowed) {
    throw new Error(
      decision.missingPermission
        ? `Tenant access denied: ${decision.reason}:${decision.missingPermission}`
        : `Tenant access denied: ${decision.reason}`,
    );
  }
}
