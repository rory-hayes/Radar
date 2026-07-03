import "server-only";

import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { auditActions, auditResourceTypes, type AuditAction, type AuditResourceType } from "@/lib/audit/actions";

const auditEventSchema = z.object({
  workspaceId: z.string().uuid().nullable().optional(),
  action: z.enum(auditActions),
  resourceType: z.enum(auditResourceTypes),
  resourceId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AuditEventInput = {
  workspaceId?: string | null;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordAuditEvent(input: AuditEventInput) {
  const event = auditEventSchema.parse(input);
  const user = await getAuthenticatedUser();
  const supabase = await createSupabaseServerClient();

  if (!user || !supabase) {
    return {
      error: "Audit logging requires an authenticated Supabase session.",
    };
  }

  const { error } = await supabase.from("audit_logs").insert({
    workspace_id: event.workspaceId ?? null,
    actor_user_id: user.id,
    action: event.action,
    resource_type: event.resourceType,
    resource_id: event.resourceId ?? null,
    metadata: event.metadata ?? {},
  });

  if (error) {
    return {
      error: `Audit log write failed: ${error.message}`,
    };
  }

  return { error: null };
}
