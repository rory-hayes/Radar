"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { checkAndRecordAbuseLimit } from "@/lib/abuse/enforcement";
import { trackProductEvent } from "@/lib/analytics/posthog";
import { recordAuditEvent } from "@/lib/audit/server";
import { getBillingGateResult } from "@/lib/billing/enforcement";
import { approvedRunnableTestCasesForRunner, buildManualRerunMetadata } from "@/lib/evaluation/manual-reruns";
import { queueEvaluationJob } from "@/lib/evaluation/job-orchestration";
import { buildFindingRerunMetadata } from "@/lib/findings/rerun-resolution";
import {
  buildFindingLifecycleTransition,
  findingLifecycleWorkflowVersion,
  formatFindingLifecycleStatus,
} from "@/lib/findings/lifecycle-workflow";
import {
  findingOwnerTeams,
  findingSeverities,
  findingStatuses,
  type FindingOwnerTeam,
} from "@/lib/findings/schema";
import {
  assignFinding,
  closeActiveFindingAssignments,
  getAssertionById,
  getFindingById,
  getTestCaseById,
  getTestCaseResultById,
  listActiveWorkspaceMembers,
  listTestCasesForAssertion,
  recordFindingActivity,
  updateFindingOwnership,
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

const noOwnerValue = "unassigned";
const findingOwnershipActionSchema = z.object({
  findingId: z.uuid(),
  ownerUserId: z.union([z.uuid(), z.literal(noOwnerValue)]).default(noOwnerValue),
  ownerTeam: z.enum(findingOwnerTeams),
  severity: z.enum(findingSeverities),
  note: optionalTrimmedString.pipe(z.string().max(1000).optional()),
});
const findingRerunActionSchema = z.object({
  findingId: z.uuid(),
});

export type FindingLifecycleState = {
  error?: string;
  success?: string;
};

export type FindingOwnershipState = FindingLifecycleState;
export type FindingRerunState = FindingLifecycleState;

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

export async function updateFindingOwnershipAction(
  _previousState: FindingOwnershipState,
  formData: FormData,
): Promise<FindingOwnershipState> {
  const result = await runWorkspaceServerAction(
    {
      input: {
        findingId: String(formData.get("findingId") ?? ""),
        ownerUserId: String(formData.get("ownerUserId") ?? noOwnerValue),
        ownerTeam: String(formData.get("ownerTeam") ?? ""),
        severity: String(formData.get("severity") ?? ""),
        note: String(formData.get("note") ?? ""),
      },
      permission: "finding:resolve",
      schema: findingOwnershipActionSchema,
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

      const ownerUserId = input.ownerUserId === noOwnerValue ? undefined : input.ownerUserId;
      const members = await listActiveWorkspaceMembers(supabase, membership.workspace.id);

      if (ownerUserId && !members.some((member) => member.userId === ownerUserId)) {
        throw serverActionError("Assignee must be an active member of this workspace.", "validation");
      }

      const now = new Date().toISOString();
      const metadata = {
        ...(finding.metadata ?? {}),
        ownerTeam: input.ownerTeam,
        ownershipUpdatedAt: now,
        ownershipUpdatedByUserId: user.id,
      };

      await updateFindingOwnership(supabase, membership.workspace.id, finding.id, {
        ownerUserId,
        ownerTeam: input.ownerTeam,
        severity: input.severity,
        metadata,
      });
      await closeActiveFindingAssignments(supabase, membership.workspace.id, finding.id, now);

      if (ownerUserId) {
        await assignFinding(supabase, membership.workspace.id, {
          findingId: finding.id,
          assigneeUserId: ownerUserId,
          assignedByUserId: user.id,
          note: input.note,
          metadata: {
            ownerTeam: input.ownerTeam,
            severity: input.severity,
          },
        });
      }

      await recordFindingActivity(supabase, membership.workspace.id, {
        findingId: finding.id,
        actorUserId: user.id,
        activityType: ownerUserId ? "assigned" : "unassigned",
        fromAssigneeUserId: finding.ownerUserId,
        toAssigneeUserId: ownerUserId,
        note: input.note ?? ownershipActivityNote(ownerUserId, input.ownerTeam, input.severity),
        metadata: {
          ownerTeam: input.ownerTeam,
          severity: input.severity,
          previousSeverity: finding.severity,
          workflowVersion: "rad-078",
        },
      });

      const auditResult = await recordAuditEvent({
        workspaceId: membership.workspace.id,
        action: "finding.updated",
        resourceType: "finding",
        resourceId: finding.id,
        metadata: {
          ownerUserId: ownerUserId ?? null,
          ownerTeam: input.ownerTeam,
          severity: input.severity,
          previousOwnerUserId: finding.ownerUserId ?? null,
          previousSeverity: finding.severity,
          workflowVersion: "rad-078",
        },
      });

      if (auditResult.error) {
        throw serverActionError(auditResult.error);
      }

      return {
        assertionId: finding.assertionId,
        ownerUserId,
        ownerTeam: input.ownerTeam,
        severity: input.severity,
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
    success: updated
      ? `Finding ownership updated for ${formatOwnerTeam(updated.ownerTeam)}.`
      : "Finding ownership updated.",
  };
}

export async function queueFindingRerunAction(
  _previousState: FindingRerunState,
  formData: FormData,
): Promise<FindingRerunState> {
  const result = await runWorkspaceServerAction(
    {
      input: {
        findingId: String(formData.get("findingId") ?? ""),
      },
      permission: "run:rerun",
      schema: findingRerunActionSchema,
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

      const assertion = await getAssertionById(supabase, membership.workspace.id, finding.assertionId);

      if (!assertion) {
        throw serverActionError("Finding assertion is not available in this workspace.", "validation");
      }

      const testCaseResult = finding.testCaseResultId
        ? await getTestCaseResultById(supabase, membership.workspace.id, finding.testCaseResultId)
        : null;
      const testCase = testCaseResult
        ? await getTestCaseById(supabase, membership.workspace.id, testCaseResult.testCaseId)
        : null;
      const testCases = await listTestCasesForAssertion(supabase, membership.workspace.id, assertion.id);
      const runnableTestCases = approvedRunnableTestCasesForRunner(assertion.runnerType, testCases);
      const requestedTestCase = testCase && runnableTestCases.some((candidate) => candidate.id === testCase.id)
        ? testCase
        : undefined;

      if (runnableTestCases.length === 0) {
        throw serverActionError("Approve at least one runnable test case before validating this fix.", "validation");
      }

      const gate = await getBillingGateResult({
        client: supabase,
        workspaceId: membership.workspace.id,
        action: "queue_run",
      });

      if (!gate.allowed) {
        throw serverActionError(gate.message ?? "This workspace has reached its billing plan limit.", "validation");
      }

      const runLimit = await checkAndRecordAbuseLimit({
        client: supabase,
        workspaceId: membership.workspace.id,
        userId: user.id,
        eventType: "eval_run",
        metadata: {
          workflow: "finding_fix_rerun",
          findingId: finding.id,
          assertionId: assertion.id,
          testCaseId: requestedTestCase?.id,
          runnerType: assertion.runnerType,
        },
      });

      if (!runLimit.allowed) {
        throw serverActionError(runLimit.message, "rate_limited");
      }

      const requestedAt = new Date().toISOString();
      const queuedTestCases = requestedTestCase ? [requestedTestCase] : runnableTestCases;
      const queued = await queueEvaluationJob(supabase, {
        workspaceId: membership.workspace.id,
        assertionId: assertion.id,
        runnerType: assertion.runnerType,
        triggerType: "manual",
        triggeredByUserId: user.id,
        queueReason: "manual",
        totalTestCases: queuedTestCases.length,
        metadata: {
          queuedBy: "rad-079_finding_rerun_action",
          executionState: "queued_for_runner",
          ...buildManualRerunMetadata({
            requestedAt,
            requestedByUserId: user.id,
            testCaseId: requestedTestCase?.id,
          }),
          ...buildFindingRerunMetadata({
            findingId: finding.id,
            requestedAt,
            requestedByUserId: user.id,
            resolutionMode: "suggest",
          }),
        },
      });

      await recordFindingActivity(supabase, membership.workspace.id, {
        findingId: finding.id,
        actorUserId: user.id,
        activityType: "rerun_linked",
        note: requestedTestCase
          ? "Queued a targeted rerun to validate this finding's fix."
          : "Queued an assertion rerun to validate this finding's fix.",
        metadata: {
          workflowVersion: "rad-079",
          evaluationRunId: queued.status === "queued" ? queued.run.id : null,
          testCaseId: requestedTestCase?.id,
        },
      });
      await trackProductEvent({
        event: "fix_rerun",
        properties: {
          workspaceId: membership.workspace.id,
          userId: user.id,
          findingId: finding.id,
          assertionId: assertion.id,
          runId: queued.status === "queued" ? queued.run.id : undefined,
          targetedTestCase: Boolean(requestedTestCase),
        },
      });

      return {
        assertionId: assertion.id,
        runId: queued.status === "queued" ? queued.run.id : null,
      };
    },
  );

  const error = serverActionErrorState(result);

  if (error) {
    return { error };
  }

  const queued = result.ok ? result.data : null;
  revalidatePath("/findings");

  if (queued?.assertionId) {
    revalidatePath(`/assertions/${queued.assertionId}`);
  }

  return { success: "Fix validation rerun queued." };
}

function ownershipActivityNote(
  ownerUserId: string | undefined,
  ownerTeam: FindingOwnerTeam,
  severity: string,
) {
  const ownerText = ownerUserId ? `assigned to user ${ownerUserId.slice(0, 8)}` : "unassigned";
  return `Finding ${ownerText} for ${formatOwnerTeam(ownerTeam)} with ${severity} priority.`;
}

function formatOwnerTeam(team: FindingOwnerTeam) {
  return team === "ops" ? "Ops" : `${team.charAt(0).toUpperCase()}${team.slice(1)}`;
}
