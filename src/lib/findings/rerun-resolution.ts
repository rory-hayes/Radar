import "server-only";

import type { FindingStatus } from "@/lib/findings/schema";
import {
  getFindingById,
  recordFindingActivity,
  updateFindingStatus,
  type JsonRecord,
  type RadarEvaluationRunJob,
  type RadarRepositoryClient,
} from "@/lib/repositories";

export const findingRerunResolutionVersion = "rad-079";
export const findingRerunResolutionModes = ["suggest", "auto_resolve"] as const;

export type FindingRerunResolutionMode = (typeof findingRerunResolutionModes)[number];

export type FindingRerunMetadata = {
  version: typeof findingRerunResolutionVersion;
  findingId: string;
  requestedAt: string;
  requestedByUserId: string;
  resolutionMode: FindingRerunResolutionMode;
};

export function buildFindingRerunMetadata(input: Omit<FindingRerunMetadata, "version">) {
  return {
    findingRerun: {
      version: findingRerunResolutionVersion,
      findingId: input.findingId,
      requestedAt: input.requestedAt,
      requestedByUserId: input.requestedByUserId,
      resolutionMode: input.resolutionMode,
    },
  };
}

export function readFindingRerunMetadata(metadata: JsonRecord): FindingRerunMetadata | null {
  const value = recordValue(metadata.findingRerun);

  if (!value || value.version !== findingRerunResolutionVersion) {
    return null;
  }

  if (
    typeof value.findingId !== "string"
    || typeof value.requestedAt !== "string"
    || typeof value.requestedByUserId !== "string"
    || !findingRerunResolutionModes.includes(value.resolutionMode as FindingRerunResolutionMode)
  ) {
    return null;
  }

  return {
    version: findingRerunResolutionVersion,
    findingId: value.findingId,
    requestedAt: value.requestedAt,
    requestedByUserId: value.requestedByUserId,
    resolutionMode: value.resolutionMode as FindingRerunResolutionMode,
  };
}

export async function processFindingRerunResolutionForRun(
  client: RadarRepositoryClient,
  workspaceId: string,
  run: RadarEvaluationRunJob,
  options: { now?: string } = {},
) {
  const rerun = readFindingRerunMetadata(run.executionMetadata);

  if (!rerun || !isPassingRerun(run)) {
    return { status: "skipped" as const };
  }

  const finding = await getFindingById(client, workspaceId, rerun.findingId);

  if (!finding || !(activeStatuses as readonly FindingStatus[]).includes(finding.status)) {
    return { status: "skipped" as const };
  }

  const now = options.now ?? new Date().toISOString();
  const toStatus: FindingStatus = rerun.resolutionMode === "auto_resolve" ? "resolved" : "fixed";
  const note = rerun.resolutionMode === "auto_resolve"
    ? "Passing rerun automatically resolved this finding."
    : "Passing rerun validated the fix and moved this finding to Fixed.";

  await updateFindingStatus(client, workspaceId, finding.id, {
    status: toStatus,
    resolvedAt: toStatus === "resolved" ? now : undefined,
    resolvedByUserId: toStatus === "resolved" ? rerun.requestedByUserId : undefined,
    resolutionSummary: toStatus === "resolved" ? note : undefined,
    clearResolution: toStatus !== "resolved",
  });
  await recordFindingActivity(client, workspaceId, {
    findingId: finding.id,
    actorUserId: rerun.requestedByUserId,
    activityType: "status_changed",
    fromStatus: finding.status,
    toStatus,
    note,
    metadata: {
      workflowVersion: findingRerunResolutionVersion,
      evaluationRunId: run.id,
      resolutionMode: rerun.resolutionMode,
    },
  });

  return { status: "updated" as const, findingId: finding.id, toStatus };
}

function isPassingRerun(run: RadarEvaluationRunJob) {
  return run.status === "passed"
    && run.failedCount === 0
    && run.errorCount === 0
    && run.warningCount === 0;
}

const activeStatuses = ["open", "investigating", "fixed"] as const satisfies readonly FindingStatus[];

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
