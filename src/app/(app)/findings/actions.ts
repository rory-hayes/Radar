"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { recordAuditEvent } from "@/lib/audit/server";
import {
  buildFindingLifecycleTransition,
  findingLifecycleWorkflowVersion,
  formatFindingLifecycleStatus,
} from "@/lib/findings/lifecycle-workflow";
import { findingStatuses } from "@/lib/findings/schema";
import {
  getFindingById,
  recordFindingActivity,
  updateFindingStatus,
} from "@/lib/repositories";
import {
  runWorkspaceServerAction,
  serverActionError,
  serverActionErrorState,
} from "@/lib/server/guardrails";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);

const findingLifecycleActionSchema = z.object({
  findingId: z.uuid(),
  status: z.enum(findingStatuses),
  note: optionalTrimmedString.pipe(z.string().max(1000).optional()),
});

export type FindingLifecycleState = {
  error?: string;
  success?: string;
};

export async function updateFindingLifecycleAction(
  _previousState: FindingLifecycleState,
  formData: FormData,
): Promise<FindingLifecycleState> {
  const result = await runWorkspaceServerAction(
    {
      input: {
        findingId: String(formData.get("findingId") ?? ""),
        status: String(formData.get("status") ?? ""),
        note: String(formData.get("note") ?? ""),
      },
      permission: "finding:resolve",
      schema: findingLifecycleActionSchema,
    },
    async ({ input, membership, user }) => {
      const supabase = await createSupabaseServerClient();

      if (!supabase) {
        throw serverActionError("Supabase is not configured for this environment.");
      }

      const finding = await getFindingById(supabase, membership.workspace.id, input.findingId);

      if (!finding) {
        throw serverActionError("Finding is not available in this workspace.", "validation");
      }

      const transition = buildFindingLifecycleTransition({
        fromStatus: finding.status,
        toStatus: input.status,
        note: input.note,
      });

      if (!transition.ok) {
        throw serverActionError(transition.error, "validation");
      }

      const now = new Date().toISOString();

      await updateFindingStatus(supabase, membership.workspace.id, finding.id, {
        status: transition.toStatus,
        resolvedAt: transition.resolutionStatus ? now : undefined,
        resolvedByUserId: transition.resolutionStatus ? user.id : undefined,
        resolutionSummary: transition.resolutionStatus ? transition.activityNote : undefined,
        clearResolution: !transition.resolutionStatus,
      });

      await recordFindingActivity(supabase, membership.workspace.id, {
        findingId: finding.id,
        actorUserId: user.id,
        activityType: "status_changed",
        fromStatus: transition.fromStatus,
        toStatus: transition.toStatus,
        note: transition.activityNote,
        metadata: {
          workflowVersion: findingLifecycleWorkflowVersion,
        },
      });

      const auditResult = await recordAuditEvent({
        workspaceId: membership.workspace.id,
        action: transition.auditAction,
        resourceType: "finding",
        resourceId: finding.id,
        metadata: {
          fromStatus: transition.fromStatus,
          toStatus: transition.toStatus,
          workflowVersion: findingLifecycleWorkflowVersion,
        },
      });

      if (auditResult.error) {
        throw serverActionError(auditResult.error);
      }

      return {
        assertionId: finding.assertionId,
        status: transition.toStatus,
      };
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    return { error };
  }

  const updated = result.ok ? result.data : null;
  revalidatePath("/findings");

  if (updated?.assertionId) {
    revalidatePath(`/assertions/${updated.assertionId}`);
  }

  return {
    success: updated ? `Finding moved to ${formatFindingLifecycleStatus(updated.status)}.` : "Finding status updated.",
  };
}
