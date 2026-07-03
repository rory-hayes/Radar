import type { RadarAssertion } from "@/lib/assertions/schema";
import type { RadarFinding, FindingStatus } from "@/lib/findings/schema";
import type { RadarEvaluationRunSummary } from "@/lib/repositories";

export type CommandCenterTrend = {
  label: string;
  value: string;
  detail: string;
  tone: "pass" | "warning" | "fail" | "neutral";
};

export type CommandCenterKpiSummary = {
  checksRun: number;
  exceptions: number;
  criticalIssues: number;
  recommendedFixes: number;
  passRate: number | null;
  monitoredAssertions: number;
  needsAttention: CommandCenterNeedsAttentionItem[];
  trends: CommandCenterTrend[];
  hasActivity: boolean;
};

export type CommandCenterNeedsAttentionItem = {
  id: string;
  title: string;
  assertionId: string;
  assertionTitle: string;
  severity: RadarFinding["severity"];
  status: RadarFinding["status"];
  confidence: number;
  customerImpact: string;
  recommendedFix: string;
};

type CommandCenterKpiInput = {
  assertions: readonly RadarAssertion[];
  findings: readonly RadarFinding[];
  runs: readonly RadarEvaluationRunSummary[];
  now?: Date;
};

const activeFindingStatuses = ["open", "investigating", "fixed"] as const satisfies readonly FindingStatus[];
const terminalRunStatuses = ["passed", "warning", "failed", "inconclusive", "error"] as const;
const oneDayMs = 24 * 60 * 60 * 1000;

export function buildCommandCenterKpiSummary({
  assertions,
  findings,
  runs,
  now = new Date(),
}: CommandCenterKpiInput): CommandCenterKpiSummary {
  const activeFindings = findings.filter((finding) =>
    (activeFindingStatuses as readonly FindingStatus[]).includes(finding.status),
  );
  const terminalRuns = runs.filter((run) => (terminalRunStatuses as readonly string[]).includes(run.status));
  const recentRuns = terminalRuns.filter((run) => isWithinDays(run.createdAt, now, 7, 0));
  const previousRuns = terminalRuns.filter((run) => isWithinDays(run.createdAt, now, 14, 7));
  const passRate = passRateForRuns(recentRuns.length > 0 ? recentRuns : terminalRuns);
  const checksTrend = recentRuns.length - previousRuns.length;
  const criticalIssues = activeFindings.filter((finding) => finding.severity === "critical").length;
  const recommendedFixes = activeFindings.filter((finding) => finding.recommendedFix.trim().length > 0).length;
  const assertionTitles = new Map(assertions.map((assertion) => [assertion.id, assertion.title]));

  return {
    checksRun: recentRuns.length,
    exceptions: activeFindings.length,
    criticalIssues,
    recommendedFixes,
    passRate,
    monitoredAssertions: assertions.filter((assertion) => assertion.status === "active").length,
    needsAttention: selectNeedsAttentionFindings(activeFindings, assertionTitles),
    hasActivity: assertions.length > 0 || findings.length > 0 || terminalRuns.length > 0,
    trends: [
      {
        label: "Run volume",
        value: signedNumber(checksTrend),
        detail: "vs previous 7 days",
        tone: checksTrend > 0 ? "pass" : checksTrend < 0 ? "warning" : "neutral",
      },
      {
        label: "Open exceptions",
        value: String(activeFindings.length),
        detail: activeFindings.length === 0 ? "No active findings" : "need review or fix validation",
        tone: activeFindings.length === 0 ? "pass" : criticalIssues > 0 ? "fail" : "warning",
      },
      {
        label: "Pass rate",
        value: passRate === null ? "No runs" : `${passRate}%`,
        detail: recentRuns.length > 0 ? "from checks run this week" : "from all completed checks",
        tone: passRateTone(passRate),
      },
    ],
  };
}

export function selectNeedsAttentionFindings(
  findings: readonly RadarFinding[],
  assertionTitles: ReadonlyMap<string, string>,
  limit = 5,
): CommandCenterNeedsAttentionItem[] {
  return [...findings]
    .filter((finding) => (activeFindingStatuses as readonly FindingStatus[]).includes(finding.status))
    .sort((a, b) => (
      severityRank(a.severity) - severityRank(b.severity)
      || statusRank(a.status) - statusRank(b.status)
      || b.confidence - a.confidence
      || a.title.localeCompare(b.title)
    ))
    .slice(0, limit)
    .map((finding) => ({
      id: finding.id,
      title: finding.title,
      assertionId: finding.assertionId,
      assertionTitle: assertionTitles.get(finding.assertionId) ?? "Assertion unavailable",
      severity: finding.severity,
      status: finding.status,
      confidence: finding.confidence,
      customerImpact: finding.customerImpact,
      recommendedFix: finding.recommendedFix,
    }));
}

function passRateForRuns(runs: readonly RadarEvaluationRunSummary[]) {
  const totals = runs.reduce(
    (counts, run) => ({
      passed: counts.passed + run.passedCount,
      checked: counts.checked + run.passedCount + run.warningCount + run.failedCount + run.errorCount,
    }),
    { passed: 0, checked: 0 },
  );

  if (totals.checked === 0) {
    return null;
  }

  return Math.round((totals.passed / totals.checked) * 100);
}

function isWithinDays(value: string, now: Date, daysAgo: number, startDaysAgo: number) {
  const timestamp = new Date(value).getTime();
  const end = now.getTime() - startDaysAgo * oneDayMs;
  const start = now.getTime() - daysAgo * oneDayMs;

  return timestamp >= start && timestamp < end;
}

function signedNumber(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function passRateTone(passRate: number | null): CommandCenterTrend["tone"] {
  if (passRate === null) return "neutral";
  if (passRate >= 95) return "pass";
  if (passRate >= 80) return "warning";
  return "fail";
}

function severityRank(severity: RadarFinding["severity"]) {
  const ranks: Record<RadarFinding["severity"], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return ranks[severity];
}

function statusRank(status: RadarFinding["status"]) {
  const ranks: Record<RadarFinding["status"], number> = {
    open: 0,
    investigating: 1,
    fixed: 2,
    resolved: 3,
    ignored: 4,
    false_positive: 5,
  };

  return ranks[status];
}
