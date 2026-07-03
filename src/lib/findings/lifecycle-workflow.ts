import "server-only";

import type { FindingStatus } from "@/lib/findings/schema";

export const findingLifecycleWorkflowVersion = "rad-077";

export const findingStatusTransitionMap = {
  open: ["investigating", "ignored", "false_positive"],
  investigating: ["open", "fixed", "ignored", "false_positive"],
  fixed: ["investigating", "resolved", "open"],
  resolved: ["open"],
  ignored: ["open"],
  false_positive: ["open"],
} as const satisfies Record<FindingStatus, readonly FindingStatus[]>;

export type FindingLifecycleTransitionInput = {
  fromStatus: FindingStatus;
  toStatus: FindingStatus;
  note?: string;
};

export type FindingLifecycleTransition =
  | {
      ok: true;
      fromStatus: FindingStatus;
      toStatus: FindingStatus;
      note?: string;
      resolutionStatus: boolean;
      auditAction: "finding.resolved" | "finding.updated";
      activityNote: string;
    }
  | {
      ok: false;
      error: string;
    };

const noteRequiredStatuses = ["resolved", "ignored", "false_positive"] as const satisfies readonly FindingStatus[];
const resolutionStatuses = ["resolved", "false_positive"] as const satisfies readonly FindingStatus[];

export function allowedFindingStatusTargets(status: FindingStatus) {
  return [...findingStatusTransitionMap[status]];
}

export function buildFindingLifecycleTransition(
  input: FindingLifecycleTransitionInput,
): FindingLifecycleTransition {
  const note = normalizedNote(input.note);

  if (input.fromStatus === input.toStatus) {
    return { ok: false, error: "Choose a different finding status." };
  }

  if (!(findingStatusTransitionMap[input.fromStatus] as readonly FindingStatus[]).includes(input.toStatus)) {
    return {
      ok: false,
      error: `Findings cannot move directly from ${formatStatus(input.fromStatus)} to ${formatStatus(input.toStatus)}.`,
    };
  }

  if ((noteRequiredStatuses as readonly FindingStatus[]).includes(input.toStatus) && (!note || note.length < 8)) {
    return {
      ok: false,
      error: `${formatStatus(input.toStatus)} requires a short lifecycle note.`,
    };
  }

  const resolutionStatus = (resolutionStatuses as readonly FindingStatus[]).includes(input.toStatus);

  return {
    ok: true,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    note,
    resolutionStatus,
    auditAction: resolutionStatus ? "finding.resolved" : "finding.updated",
    activityNote: note ?? `Status changed from ${formatStatus(input.fromStatus)} to ${formatStatus(input.toStatus)}.`,
  };
}

export function formatFindingLifecycleStatus(status: FindingStatus) {
  return formatStatus(status);
}

function normalizedNote(note?: string) {
  const trimmed = note?.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed.slice(0, 1000) : undefined;
}

function formatStatus(status: FindingStatus) {
  return status
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
