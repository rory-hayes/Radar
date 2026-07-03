import type { RadarAssertion } from "@/lib/assertions/schema";
import type { RadarFinding } from "@/lib/findings/schema";
import type { RadarSource } from "@/lib/sources/schema";
import type { RadarEvaluationRunSummary, RadarFindingActivity } from "@/lib/repositories";

export type CommandCenterRecentActivityKind =
  | "source_synced"
  | "source_sync_failed"
  | "assertion_run_completed"
  | "finding_opened"
  | "finding_resolved"
  | "finding_rerun"
  | "report_generated";

export type CommandCenterRecentActivityItem = {
  id: string;
  kind: CommandCenterRecentActivityKind;
  title: string;
  description: string;
  timestamp: string;
  href?: string;
  statusLabel: string;
  tone: "pass" | "warning" | "fail" | "neutral";
  metadata: string[];
};

export type CommandCenterReportActivity = {
  id: string;
  title: string;
  generatedAt: string;
  href?: string;
  periodLabel?: string;
};

type BuildRecentActivityInput = {
  assertions: readonly RadarAssertion[];
  findings: readonly RadarFinding[];
  sources: readonly RadarSource[];
  runs: readonly RadarEvaluationRunSummary[];
  findingActivity: readonly RadarFindingActivity[];
  reportActivity?: readonly CommandCenterReportActivity[];
  limit?: number;
};

const terminalRunStatuses = ["passed", "warning", "failed", "inconclusive", "error"] as const;

export function buildRecentActivityFeed({
  assertions,
  findings,
  sources,
  runs,
  findingActivity,
  reportActivity = [],
  limit = 8,
}: BuildRecentActivityInput): CommandCenterRecentActivityItem[] {
  const assertionTitles = new Map(assertions.map((assertion) => [assertion.id, assertion.title]));
  const findingTitles = new Map(findings.map((finding) => [finding.id, finding.title]));
  const findingById = new Map(findings.map((finding) => [finding.id, finding]));
  const resolvedActivityFindingIds = new Set<string>();

  const activityItems: CommandCenterRecentActivityItem[] = [
    ...sourceSyncItems(sources),
    ...runItems(runs, assertionTitles),
    ...findingOpenedItems(findings, assertionTitles),
    ...findingActivityItems(findingActivity, findingTitles, findingById, resolvedActivityFindingIds),
    ...findingResolvedFallbackItems(findings, assertionTitles, resolvedActivityFindingIds),
    ...reportItems(reportActivity),
  ];

  return activityItems
    .filter((item) => isValidTimestamp(item.timestamp))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

function sourceSyncItems(sources: readonly RadarSource[]): CommandCenterRecentActivityItem[] {
  return sources
    .filter((source) => source.lastSyncedAt || (source.syncStatus === "error" && source.updatedAt))
    .map((source) => {
      const failed = source.syncStatus === "error";
      const timestamp = failed ? (source.lastSyncedAt ?? source.updatedAt) : source.lastSyncedAt;

      return {
        id: `source:${source.id}:${timestamp}`,
        kind: failed ? "source_sync_failed" : "source_synced",
        title: failed ? "Source sync needs attention" : "Source synced",
        description: source.name,
        timestamp: timestamp ?? "",
        href: `/sources/${source.id}`,
        statusLabel: failed ? "Failed" : "Synced",
        tone: failed ? "fail" : "pass",
        metadata: [source.type.replaceAll("_", " "), source.lastSyncError].filter(isPresent),
      } satisfies CommandCenterRecentActivityItem;
    });
}

function runItems(
  runs: readonly RadarEvaluationRunSummary[],
  assertionTitles: ReadonlyMap<string, string>,
): CommandCenterRecentActivityItem[] {
  return runs
    .filter((run) => (terminalRunStatuses as readonly string[]).includes(run.status))
    .map((run) => ({
      id: `run:${run.id}`,
      kind: "assertion_run_completed",
      title: "Assertion run completed",
      description: assertionTitles.get(run.assertionId) ?? "Assertion unavailable",
      timestamp: run.completedAt ?? run.createdAt,
      href: `/assertions/${run.assertionId}`,
      statusLabel: runStatusLabel(run.status),
      tone: runTone(run.status),
      metadata: [
        runnerLabel(run.runnerType),
        `${run.passedCount} passed`,
        `${run.failedCount + run.errorCount} failed or errored`,
      ],
    }));
}

function findingOpenedItems(
  findings: readonly RadarFinding[],
  assertionTitles: ReadonlyMap<string, string>,
): CommandCenterRecentActivityItem[] {
  return findings
    .filter((finding) => finding.firstSeenAt)
    .map((finding) => ({
      id: `finding-opened:${finding.id}`,
      kind: "finding_opened",
      title: "Finding opened",
      description: finding.title,
      timestamp: finding.firstSeenAt ?? "",
      href: `/findings?findingId=${finding.id}`,
      statusLabel: severityLabel(finding.severity),
      tone: finding.severity === "critical" ? "fail" : finding.severity === "high" ? "warning" : "neutral",
      metadata: [assertionTitles.get(finding.assertionId) ?? "Assertion unavailable", statusLabel(finding.status)],
    }));
}

function findingActivityItems(
  activities: readonly RadarFindingActivity[],
  findingTitles: ReadonlyMap<string, string>,
  findingById: ReadonlyMap<string, RadarFinding>,
  resolvedActivityFindingIds: Set<string>,
): CommandCenterRecentActivityItem[] {
  return activities.flatMap<CommandCenterRecentActivityItem>((activity) => {
    if (isResolvedActivity(activity)) {
      resolvedActivityFindingIds.add(activity.findingId);
      return [
        {
          id: `finding-resolved:${activity.id}`,
          kind: "finding_resolved",
          title: "Finding resolved",
          description: findingTitles.get(activity.findingId) ?? "Finding unavailable",
          timestamp: activity.createdAt,
          href: `/findings?findingId=${activity.findingId}`,
          statusLabel: statusLabel(activity.toStatus ?? "resolved"),
          tone: "pass" as const,
          metadata: [activity.note, findingById.get(activity.findingId)?.resolutionSummary].filter(isPresent),
        },
      ];
    }

    if (activity.activityType === "rerun_linked") {
      const finding = findingById.get(activity.findingId);

      return [
        {
          id: `finding-rerun:${activity.id}`,
          kind: "finding_rerun",
          title: "Fix validation rerun linked",
          description: findingTitles.get(activity.findingId) ?? "Finding unavailable",
          timestamp: activity.createdAt,
          href: `/findings?findingId=${activity.findingId}`,
          statusLabel: finding ? statusLabel(finding.status) : "Rerun",
          tone: finding?.status === "resolved" ? "pass" : "warning",
          metadata: [activity.note].filter(isPresent),
        },
      ];
    }

    return [];
  });
}

function findingResolvedFallbackItems(
  findings: readonly RadarFinding[],
  assertionTitles: ReadonlyMap<string, string>,
  resolvedActivityFindingIds: ReadonlySet<string>,
): CommandCenterRecentActivityItem[] {
  return findings
    .filter((finding) => finding.resolvedAt && !resolvedActivityFindingIds.has(finding.id))
    .map((finding) => ({
      id: `finding-resolved-fallback:${finding.id}`,
      kind: "finding_resolved",
      title: "Finding resolved",
      description: finding.title,
      timestamp: finding.resolvedAt ?? "",
      href: `/findings?findingId=${finding.id}`,
      statusLabel: statusLabel(finding.status),
      tone: "pass",
      metadata: [assertionTitles.get(finding.assertionId), finding.resolutionSummary].filter(isPresent),
    }));
}

function reportItems(reports: readonly CommandCenterReportActivity[]): CommandCenterRecentActivityItem[] {
  return reports.map((report) => ({
    id: `report:${report.id}`,
    kind: "report_generated",
    title: "Trust report generated",
    description: report.title,
    timestamp: report.generatedAt,
    href: report.href,
    statusLabel: "Report",
    tone: "neutral",
    metadata: [report.periodLabel].filter(isPresent),
  }));
}

function isResolvedActivity(activity: RadarFindingActivity) {
  return (
    activity.activityType === "resolved" ||
    (activity.activityType === "status_changed" &&
      (activity.toStatus === "resolved" || activity.toStatus === "false_positive"))
  );
}

function runStatusLabel(status: RadarEvaluationRunSummary["status"]) {
  const labels: Record<RadarEvaluationRunSummary["status"], string> = {
    queued: "Queued",
    running: "Running",
    passed: "Passed",
    warning: "Warning",
    failed: "Failed",
    error: "Error",
    inconclusive: "Inconclusive",
    canceled: "Canceled",
  };

  return labels[status];
}

function runTone(status: RadarEvaluationRunSummary["status"]): CommandCenterRecentActivityItem["tone"] {
  if (status === "passed") return "pass";
  if (status === "failed" || status === "error") return "fail";
  if (status === "warning" || status === "inconclusive") return "warning";
  return "neutral";
}

function runnerLabel(runnerType: RadarEvaluationRunSummary["runnerType"]) {
  const labels: Record<RadarEvaluationRunSummary["runnerType"], string> = {
    knowledge: "Knowledge runner",
    journey: "Journey runner",
    integration: "Integration runner",
  };

  return labels[runnerType];
}

function severityLabel(severity: RadarFinding["severity"]) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function statusLabel(status: RadarFinding["status"]) {
  const labels: Record<RadarFinding["status"], string> = {
    open: "Open",
    investigating: "Investigating",
    fixed: "Fixed",
    resolved: "Resolved",
    ignored: "Ignored",
    false_positive: "False positive",
  };

  return labels[status];
}

function isValidTimestamp(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

function isPresent(value: string | undefined | null): value is string {
  return Boolean(value && value.trim().length > 0);
}
